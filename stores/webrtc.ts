import { defineStore } from 'pinia';
import type { RTCCandidate } from '~/types/WebRTC/RTCCandidate';
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';
import type { RTCStream } from '~/types/WebRTC/RTCStream';
import type { RTCSignalRequest } from '~/types/WebRTC/RTCSignalRequest';
import type { RTCPeer } from '~/types/WebRTC/RTCPeer';
import type { User } from '~/types/user';
import type { RTCConnected } from '~/types/WebRTC/RTCConnected';
import type { RTCBase } from '~/types/WebRTC/RTCBase';

export const useWebRTCStore = defineStore('rtc', () => {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
    const VConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: 16 / 9,
    }; 
    const ws = useWebSocketStore()
    const conversation = useConversationStore();
    const auth = useAuthStore();

    // Trigger the ringtone, when a call is incoming the ringtone can be played only if the user have interacted with the page
    const ringtone = ref<boolean>(false);

    const call = ref<RTCSignal | null>(null);
    const oncall = ref<boolean>(false);
    const stream = ref<MediaStream | null>(null);
    const audio = ref<boolean>(true);
    const video = ref<boolean>(true);
    const screen = ref<boolean>(false);
    const streams = ref<RTCStream[]>([]);
    const peers = ref<RTCPeer[]>([]);
    const signaltrigger = ref<boolean>(false);
    const refuses = ref<User[]>([]);

    watch(() => audio.value, async (value) => {
        if (!stream.value) return;


        if (!value) {
            const tracks = stream.value.getAudioTracks();
            tracks.forEach(track => track.stop());

            for (const peer of peers.value) {
                for (const sender of peer.peer.getSenders()) {
                    if (sender.track?.kind === 'audio') peer.peer.removeTrack(sender);
                }
            }

            for (const track of tracks) {
                stream.value.removeTrack(track);
            }
        } else {
            const tmp = await devices({ audio: true, video: false });
            if (!tmp) return;

            const track = tmp.getAudioTracks()[0];
            stream.value.addTrack(track);

            for (const peer of peers.value) {
                const sender = peer.peer.getSenders().find(sender => sender.track?.kind === 'audio');
                if (sender) sender.replaceTrack(track);
                else peer.peer.addTrack(track, stream.value);
            }
        }
    });

    watch(() => video.value, async (value) => {
        if (!stream.value) return;

        
        if (!value) {
            const tracks = stream.value.getVideoTracks();
            tracks.forEach(track => track.stop());

            for (const peer of peers.value) {
                console.log('Peer:', peer.user.id);
                for (const sender of peer.peer.getSenders()) {
                    if (sender.track?.kind === 'video') peer.peer.removeTrack(sender);
                }
            }

            for (const track of tracks) {
                stream.value.removeTrack(track);
            }
        } else { // Add video track to the peer connection
            const tmp = await devices({ audio: false, video: true });
            if (!tmp) return;

            const track = tmp.getVideoTracks()[0];
            stream.value.addTrack(track);

            for (const peer of peers.value) {
                const sender = peer.peer.getSenders().find(sender => sender.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(track);
                }
                else {
                    peer.peer.addTrack(track, stream.value);
                }
            }
        }
        

        for (const s of streams.value) {
            if (s.stream.id == stream.value.id) s.signal.video = value;
        }
    });

    watch(() => screen.value, async (value) => {
        if (!stream.value) return;


        if (value) {
            if (!auth.user) return;
            if (!conversation.conversation) return;
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (!screenStream) return;
            
            const video = screenStream.getVideoTracks()[0];
            
            for (const peer of peers.value) {
            
                const signal = streams.value.find(s => s.stream.id == stream.value?.id);
                const RTCSignal: RTCSignal = { 
                    stream_id: screenStream.id, 
                    user: auth.user, 
                    toID: peer.user.id,
                    actives: [],
                    conversation: conversation.conversation.id, 
                    data: signal?.signal?.data,
                    audio: false, 
                    video: true, 
                    screen: true,
                    negotiation: false,
                };
                addstream(screenStream, RTCSignal);
                peer.peer.addTrack(video, screenStream);
            }
        } else {
            const screenStream = streams.value.find(s => {
                if (!s.signal) return false;
                if (!auth.user) return false;
                return s.signal.screen && s.signal.user.id == auth.user.id;
            });
            if (!screenStream) return;
    
            const video = screenStream.stream.getVideoTracks()[0];

            for (const peer of peers.value) {
                const sender = peer.peer.getSenders().find(sender => sender.track?.id == video.id);
                if (sender) peer.peer.removeTrack(sender);
            }

            screenStream.stream.getTracks().forEach(track => track.stop());
            streams.value = streams.value.filter(s => s.stream.id != screenStream.stream.id);
        }
    });

    watch(() => signaltrigger.value, (value) => {
        if (!value) return;
        if (oncall.value) requiresignal();
    });

    async function init(options = { audio: true, video: true }) {
        try {
            if (!conversation.conversation) throw new Error('No conversation selected'); // This should never happen
            if (!auth.user) throw new Error('No user authenticated'); // This should never happen

            await createstream(options, true);
            if (!stream.value) throw new Error('No stream available');

            for (const user of conversation.conversation.participants) {
                if (user.id == auth.user.id) continue;
                const peer = createpeer(user);

                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);

                const RTCSignal: RTCSignal = { 
                    stream_id: stream.value.id,
                    user: auth.user,
                    toID: user.id,
                    actives: [],
                    conversation: conversation.conversation.id, 
                    data: offer, // TODO
                    audio: audio.value,
                    video: video.value,
                    screen: screen.value,
                    negotiation: false,
                };
                addstream(stream.value, RTCSignal);
                ws.call(RTCSignal);
            }
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
        }
    }

    //#region Setup
    async function devices(constraints: { audio: boolean, video: boolean | MediaTrackConstraints }) {
        if (constraints.video) {
            constraints.video = VConstraints;
        }
        return await navigator.mediaDevices.getUserMedia(constraints);
    }

    async function createstream(options: { audio: boolean, video: boolean }, init: boolean = false) {
        // If there is already a stream, return
        if (stream.value) return;

        // Always allow audio, otherwise the call will fail
        stream.value = await devices({ audio: true, video: options.video });
        if (!stream.value) throw new Error('No stream available');

        if (!options.audio) {
            stream.value.getAudioTracks().forEach(track => track.enabled = false);
            audio.value = false;
        }

        if (!options.video) {
            stream.value.getVideoTracks().forEach(track => track.enabled = false);
            video.value = false;
        }

        // Create dummy video track, otherwise the call will think there's no video
        if (!options.video && init) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas context not available');
    
            context.fillStyle = 'black';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            const str = canvas.captureStream();
            const track = str.getVideoTracks()[0];
    
            stream.value.addTrack(track);
        }
    }

    function addstream(stream: MediaStream, signal: RTCSignal | null) {
        const exists = streams.value.find(s => s.stream.id == stream.id);
        if (exists) return;

        streams.value.push({ stream: stream, signal: signal });
    }

    function createpeer(user: User): RTCPeerConnection {
        const peer = new RTCPeerConnection(configuration);
            
        peer.onconnectionstatechange = (event) => {
            if (!peer) return;
            console.log(peer.connectionState);
            if (peer.connectionState == 'connected') {
                oncall.value = true;

                if (!conversation.conversation) return;
                if (!auth.user) return;
                if (!stream.value) return;
                // if (conversation.conversation.participants.length <= 2) return;

                const RTCConnected: RTCConnected = {
                    user: auth.user.id,
                    conversation: conversation.conversation.id,
                    peers: peers.value.map(p => p.user.id),
                }
                ws.call(RTCConnected, 'connected');
                signaltrigger.value = true;
            }
        }

        // peer.oniceconnectionstatechange = (event) => {
        //     if (!peer) return;
        //     console.log(peer.iceConnectionState);
        // }
        
        const RTCPeer: RTCPeer = { user: user, peer: peer, candidates: [] };

        tracks(peer)
        remotestream(RTCPeer)
        iceconnectionchange(RTCPeer)
        icecandidates(RTCPeer)
        negotiate(RTCPeer)


        peers.value.push(RTCPeer);
        return peer;
    }

    function tracks(peer: RTCPeerConnection) {
        if (!stream.value) throw new Error("Stream it's not initialized"); // This should never happen, just to satisfy TS
        
        for (const track of stream.value.getTracks()) {
            peer.addTrack(track, stream.value)
        }
    }

    function remotestream(peer: RTCPeer) {
        peer.peer.ontrack = (event) => {
            const ids = streams.value.map(s => s.stream.id);
            for (const s of event.streams) {
                if (ids.includes(s.id)) continue;
                addstream(s, null);
            }

            event.streams.forEach(s => {
                s.onremovetrack = (event) => {
                    const stream = streams.value.find(stream => stream.stream.id == s.id);
                    console.log('Removing stream:', stream);
                    if (stream?.signal.screen) streams.value = streams.value.filter(stream => stream.stream.id != s.id);
                }

                // If the stream it's in active = false, it can't be activated again, it needs to be replaced
                const tmp = streams.value.find(stream => stream.stream.id == s.id);
                if (!tmp) return;

                if (!tmp.stream.active && s.active) {
                    const ID = tmp.stream.id;
                    streams.value = streams.value.map(stream => {
                        if (stream.stream.id == ID) stream.stream = s;
                        return stream;
                    });
                }
            });
        }
    }

    function iceconnectionchange(peer: RTCPeer) {
        peer.peer.oniceconnectionstatechange = (event) => {
            const state = peer.peer.iceConnectionState;
            if (state === "disconnected" || state === "failed" || state === "closed") {
                // Handle stream cleanup
                const s = streams.value.find(s => s.signal?.user.id == peer.user.id);
                if (s) streams.value = streams.value.filter(_ => _.stream.id != s.stream.id);

                // Handle peer cleanup
                peers.value = peers.value.filter(p => p.user.id != peer.user.id);
            }
        }
    }
    //#endregion Setup

    function logout() {
        if (stream.value) stream.value.getTracks().forEach(track => track.stop());
        call.value = null;
        oncall.value = false;
        stream.value = null;

        for (const s of streams.value) {
            s.stream.getTracks().forEach(track => track.stop());
        }
        streams.value = [];

        for (const peer of peers.value) {
            peer.peer.close();
        }
        peers.value = [];

        refuses.value = [];
        signaltrigger.value = false;
    }

    function signaling(data: RTCSignal) {
        if (data.negotiation && data.data.type == "offer") negotiation(data);
        else if (data.data.type == "offer" && oncall.value) offer(data, { audio: data.audio, video: data.video });
        else if (data.data.type == "offer") incomingcall(data);
        else if (data.data.type == "answer") answer(data);
    }

    async function incomingcall(signal: RTCSignal) {
        try {
            call.value = signal;
            if (!conversation.conversation || conversation.conversation.id != signal.conversation) {
                conversation.conversation = await conversation.one(signal.conversation);
            }
        } catch (error) {
            console.error('Error incoming call:', error);
        }
    }

    async function offer(signal: RTCSignal, options: { audio: boolean, video: boolean }) {
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected"); // This should never happen, just to satisfy TS

        await createstream(options);
        if (!stream.value) throw new Error("No stream available"); // This should never happen, just to satisfy TS

        for (const user of conversation.conversation.participants) {
            if (user.id != signal.user.id) continue;
            // If the peer already exists, ignore the offer
            if (peers.value.find(p => p.user.id == user.id)) continue; // TODO: Sometimes create a bug

            const peer = createpeer(user);

            const offer = new RTCSessionDescription(signal.data);
            peer.setRemoteDescription(offer)
            
            const answer = await peer.createAnswer();
            peer.setLocalDescription(answer);

            const RTCSignal: RTCSignal = {
                stream_id: stream.value.id,
                user: auth.user,
                toID: user.id,
                actives: [],
                conversation: signal.conversation,
                data: answer,
                audio: audio.value,
                video: video.value,
                screen: screen.value,
                negotiation: false,
            }
            addstream(stream.value, RTCSignal);
            ws.call(RTCSignal)
        }
    }

    async function answer(signal: RTCSignal) {
        if (!peers.value.length) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        console.log('Answer:', signal);
        
        // If it's stable, it's a new answer from a multiple streams call
        for (const peer of peers.value) {
            if (peer.user.id != signal.user.id) continue;
            // if (peer.peer.signalingState != 'stable') continue;
            const answer = new RTCSessionDescription(signal.data);
            peer.peer.setRemoteDescription(answer);
        }

        if (!auth.user) throw new Error("No user authenticated");
        const data: RTCBase = {
            user: signal.user.id,
            receiver: auth.user.id,
            conversation: signal.conversation,
        }
        sendcandidates(data);
        if (!signal.negotiation) triggercandidates(signal.user.id);
    }

    //#region ICE Candidates
    // Register possible candidates 
    function icecandidates(peer: RTCPeer) {
        if (!peer) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        peer.peer.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                peer.candidates.push(event.candidate)
            }
        }
    }

    function triggercandidates(receiver: number) {
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected");

        const data: RTCBase = {
            user: auth.user.id,
            receiver: receiver,
            conversation: conversation.conversation.id,
        }
        ws.call(data, 'trigger-candidates');
    }

    // Send all candidates
    function sendcandidates(data: RTCBase) {
        const peer = peers.value.find(p => p.user.id == data.user);
        if (!peer) throw new Error("Peer not found");
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected"); // TODO : should select the conversation
        
        const RTCCandidate: RTCCandidate = {
            user: auth.user.id,
            receiver: data.user,
            conversation: conversation.conversation.id,
            candidates: [...peer.candidates],
        }
        ws.call(RTCCandidate, 'candidates');

        peer.candidates = [];
    }

    // Receiving Socket candidates
    async function candidate(data: RTCCandidate) {
        const peer = peers.value.find(p => p.user.id == data.user);
        if (!peer) throw new Error("Peer not found");
        for (const candidate of data.candidates){
            await peer.peer.addIceCandidate(candidate);
        }
    }
    //#endregion End ICE Candidates

    async function secondarycalls(users: number[]) {
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected");
        if (!stream.value) throw new Error("No stream available");

        for (const u of users) {
            if (u == auth.user.id) continue;
            if (peers.value.find(p => p.user.id == u)) continue;
            if (refuses.value.find(r => r.id == u)) continue;

            const user = conversation.conversation.participants.find(p => p.id == u);
            if (!user) throw new Error("User not found");

            const peer = createpeer(user);

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            const RTCSignal: RTCSignal = { 
                stream_id: stream.value.id,
                user: auth.user,
                toID: user.id,
                actives: [],
                conversation: conversation.conversation.id, 
                data: offer, // TODO
                audio: audio.value,
                video: video.value,
                screen: screen.value,
                negotiation: false,
            };
            ws.call(RTCSignal);
        }
    }

    // Require the missing signals
    function requiresignal() {
        signaltrigger.value = false;
        
        const ids = streams.value.filter(s => s.signal == null).map(s => s.stream.id);
        if (ids.length == 0) return;
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected");

        const req: RTCSignalRequest = {
            ids: ids,
            user: auth.user,
            conversation: conversation.conversation.id,
        }

        ws.call(req, 'require-signal');
    }

    function signalrequested(signal: RTCSignalRequest) {
        const signals = streams.value.filter(s => signal.ids.includes(s.stream.id)).map(s => s.signal);
        if (!signals) return 
        
        for (const s of signals) {
            if (s) ws.call(s, 'signal');
        }
    }

    function signal(signal: RTCSignal) {
        syncstreams(signal);
    }

    function syncstreams(signal: RTCSignal) {
        for (const stream of streams.value) {
            if (stream.stream.id == signal.stream_id) stream.signal = signal;
        }
    }

    //#region Negotiation
    // Sending negotiation
    async function negotiate(peer: RTCPeer) {
        peer.peer.onnegotiationneeded = async () => {
            if (!stream.value) throw new Error("No stream available"); // This should never happen, just to satisfy TS
            if (!auth.user) throw new Error("No user authenticated");
            if (!conversation.conversation) throw new Error("No conversation selected"); // TODO : should select the conversation
            if (peer.peer.connectionState != 'connected') return;

            let ID = stream.value.id;
            let s = streams.value.find(s => s.stream.id == stream.value?.id);
            if (!s) throw new Error("Stream not found");
            if (!s.signal) throw new Error("Signal not found");

            // It means that it's a screen sharing stream
            if (s.signal.video == video.value && s.signal.audio == audio.value) {
                s = streams.value.find(s => s.signal.screen && s.signal.user.id == auth.user?.id);
                if (s) ID = s.stream.id;
            }

            const offer = await peer.peer.createOffer();
            await peer.peer.setLocalDescription(offer);
    
            const RTCSignal: RTCSignal = {
                stream_id: ID,
                user: auth.user,
                toID: peer.user.id,
                actives: [],
                conversation: conversation.conversation.id,
                data: offer,
                audio: audio.value,
                video: video.value,
                screen: screen.value,
                negotiation: true,
            }
            ws.call(RTCSignal, 'negotiation')
        }
    }

    // Receiving negotiation
    async function negotiation(signal: RTCSignal) {
        console.log('Negotiation:', signal);
        
        if (!stream.value) throw new Error("No stream available"); // This should never happen, just to satisfy TS
        if (!auth.user) throw new Error("No user authenticated");
        const peer = peers.value.find(p => p.user.id == signal.user.id);
        if (!peer) throw new Error("Peer not found");

        for (const s of streams.value) {
            if (s.stream.id == signal.stream_id) s.signal = signal;
        }

        const offer = new RTCSessionDescription(signal.data);
        peer.peer.setRemoteDescription(offer)
        
        const answer = await peer.peer.createAnswer();
        peer.peer.setLocalDescription(answer);
        
        const data: RTCBase = {
            user: signal.user.id,
            receiver: auth.user.id,
            conversation: signal.conversation,
        }
        sendcandidates(data);

        const RTCSignal: RTCSignal = {
            stream_id: stream.value.id,
            user: auth.user,
            toID: signal.user.id,
            actives: [],
            conversation: signal.conversation,
            data: answer,
            audio: audio.value,
            video: video.value,
            screen: screen.value,
            negotiation: true,
        }
        ws.call(RTCSignal, 'negotiation')
        signaltrigger.value = true;
    }
    //#endregion End Negotiation

    function hangout() {
        logout();
    }

    function refuse(signal: RTCSignal) {
        if (!auth.user) throw new Error("No user authenticated");

        signal.toID = signal.user.id;
        signal.user = auth.user;
        
        ws.call(signal, 'refuse');
        logout();
    }

    function refused(signal: RTCSignal) {
        
        refuses.value.push(signal.user);

        const peer = peers.value.find(p => p.user.id == signal.user.id);
        if (!peer) return;
        
        peer.peer.close();
        peers.value = peers.value.filter(p => p.user.id != signal.user.id);
    }

    return {
        ringtone,
        call,
        stream,
        audio,
        video,
        screen,
        streams,
        init,
        secondarycalls,
        logout,
        signaling,
        offer,
        answer,
        candidate,
        sendcandidates,
        negotiation,
        signalrequested,
        signal,
        hangout,
        refuse,
        refused,
    }
});
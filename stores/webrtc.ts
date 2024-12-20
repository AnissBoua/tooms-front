import { defineStore } from 'pinia';
import type { RTCCandidate } from '~/types/WebRTC/RTCCandidate';
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';
import type { RTCStream } from '~/types/WebRTC/RTCStream';
import type { RTCSignalRequest } from '~/types/WebRTC/RTCSignalRequest';

export const useWebRTCStore = defineStore('rtc', () => {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
    const ws = useWebSocketStore()
    const conversation = useConversationStore();
    const auth = useAuthStore();

    const call = ref<RTCSignal | null>(null);
    const stream = ref<MediaStream | null>(null);
    const audio = ref<boolean>(true);
    const video = ref<boolean>(true);
    const screen = ref<boolean>(false);
    const streams = ref<RTCStream[]>([]);
    
    const pc = ref<RTCPeerConnection | null>(null);
    const candidates = ref<RTCIceCandidate[]>([]);
    const checking = ref<boolean>(false);

    watch(() => checking.value, (value) => {
        console.log('Checking:', value);
        if (!value) return;
        sendcandidates();
    });

    watch(() => audio.value, async (value) => {
        if (!pc.value) return;
        if (!stream.value) return;


        if (!value) { // Remove audio track from the peer connection
            const tracks = stream.value.getAudioTracks();
            tracks.forEach(track => track.stop());

            for (const sender of pc.value.getSenders()) {
                if (sender.track?.kind === 'audio') pc.value.removeTrack(sender);
            }

            for (const track of tracks) {
                stream.value.removeTrack(track);
            }
        } else { // Add audio track to the peer connection
            const tmp = await devices({ audio: true, video: false });
            if (!tmp) return;

            const track = tmp.getAudioTracks()[0];
            stream.value.addTrack(track);

            const sender = pc.value.getSenders().find(sender => sender.track?.kind === 'audio');
            if (sender) sender.replaceTrack(track);
            else pc.value.addTrack(track, stream.value);
        }
    });

    watch(() => video.value, async (value) => {
        if (!pc.value) return;
        if (!stream.value) return;
        
        if (!value) { // Remove video track from the peer connection
            const tracks = stream.value.getVideoTracks();
            tracks.forEach(track => track.stop());

            for (const sender of pc.value.getSenders()) {
                if (sender.track?.kind === 'video') pc.value.removeTrack(sender);
            }

            for (const track of tracks) {
                stream.value.removeTrack(track);
            }
        } else { // Add video track to the peer connection
            const tmp = await devices({ audio: false, video: true });
            if (!tmp) return;

            const track = tmp.getVideoTracks()[0];
            stream.value.addTrack(track);

            const sender = pc.value.getSenders().find(sender => sender.track?.kind === 'video');
            if (sender) sender.replaceTrack(track);
            else pc.value.addTrack(track, stream.value);
        }

        for (const s of streams.value) {
            if (s.stream.id == stream.value.id) s.signal.video = value;
        }
    });

    watch(() => screen.value, async (value) => {
        if (!pc.value) return;
        if (!stream.value) return;

        if (value) {
            if (!auth.user) return;
            if (!conversation.conversation) return;
            
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (!screenStream) return;

            const video = screenStream.getVideoTracks()[0];
            pc.value.addTrack(video, screenStream);

            const signal = streams.value.find(s => s.stream.id == stream.value?.id);
            const RTCSignal: RTCSignal = { 
                stream_id: screenStream.id, 
                user: auth.user, 
                conversation: conversation.conversation.id, 
                data: signal?.signal?.data,
                audio: false, 
                video: true, 
                screen: true,
                negotiation: false,
            };
            streams.value.push({ stream: screenStream, signal: RTCSignal });
        } else {
            const screenStream = streams.value.find(s => s.signal?.screen);
            if (!screenStream) return;

            const video = screenStream.stream.getVideoTracks()[0];
            const sender = pc.value.getSenders().find(sender => sender.track?.id == video.id);
            
            if (sender) pc.value.removeTrack(sender);

            screenStream.stream.getTracks().forEach(track => track.stop());
            streams.value = streams.value.filter(s => s.stream.id != screenStream.stream.id);
        }
    });

    watch(() => streams.value, (value) => {
        if (value.length == 0) return;

        requiresignal();
    }, { deep: true });

    async function init(options = { audio: true, video: true }) {
        try {
            if (!conversation.conversation) throw new Error('No conversation selected'); // This should never happen
            if (!auth.user) throw new Error('No user authenticated'); // This should never happen

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

                // Create dummy video track
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Canvas context not available');

                context.fillStyle = 'black';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                const str = canvas.captureStream();
                const track = str.getVideoTracks()[0];

                stream.value.addTrack(track);
            }

            pc.value = new RTCPeerConnection(configuration);
            
            pc.value.onconnectionstatechange = (event) => {
                if (!pc.value) return;
                console.log(pc.value.connectionState);
            }

            pc.value.oniceconnectionstatechange = (event) => {
                if (!pc.value) return;
                if (pc.value.iceConnectionState == 'checking') checking.value = true;
                console.log(pc.value.iceConnectionState);
            }
            
            tracks()
            remotestream()
            icecandidates()
            await negotiate()
            
            const offer = await pc.value.createOffer();
            await pc.value.setLocalDescription(offer);


            const RTCSignal: RTCSignal = { 
                stream_id: stream.value.id,
                user: auth.user,
                conversation: conversation.conversation.id, 
                data: offer,
                audio: audio.value,
                video: video.value,
                screen: screen.value,
                negotiation: false,
            };
            streams.value.push({ stream: stream.value, signal: RTCSignal });
            ws.call(RTCSignal);
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
        }
    }

    function logout() {
        if (stream.value) stream.value.getTracks().forEach(track => track.stop());
        if (pc.value) pc.value.close();
        call.value = null;
        stream.value = null;
        pc.value = null;
        candidates.value = [];
        streams.value = [];
    }

    async function devices(constraints: { audio: boolean, video: boolean }) {
        return await navigator.mediaDevices.getUserMedia(constraints);
    }

    function signaling(data: RTCSignal) {
        if (data.negotiation && data.data.type == "offer") negotiation(data);
        else if (data.data.type == "offer") incomingcall(data);
        else if (data.data.type == "answer") answer(data);
    }

    async function incomingcall(data: RTCSignal) {
        try {
            call.value = data;
        } catch (error) {
            console.error('Error incoming call:', error);
        }
    }

    async function offer(signal: RTCSignal, options: { audio: boolean, video: boolean }) {
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) {
            conversation.conversation = await conversation.one(signal.conversation);
        }

        // Always allow audio, otherwise the call will fail
        stream.value = await devices({ audio: true, video: options.video });
        if (!stream.value) throw new Error("No stream available");

        if (!options.audio) {
            stream.value.getAudioTracks().forEach(track => track.enabled = false);
            audio.value = false;
        }

        if (!options.video) {
            stream.value.getVideoTracks().forEach(track => track.enabled = false);
            video.value = false;
        }

        pc.value = new RTCPeerConnection(configuration);

        tracks()
        remotestream()
        icecandidates()
        negotiate()

        pc.value.onconnectionstatechange = (event) => {
            if (!pc.value) return;
            console.log(pc.value.connectionState);
        }

        pc.value.oniceconnectionstatechange = (event) => {
            if (!pc.value) return;
            if (pc.value.iceConnectionState == 'checking') checking.value = true;
            console.log(checking.value);
            console.log(pc.value.iceConnectionState);
        }

        const offer = new RTCSessionDescription(signal.data);
        pc.value.setRemoteDescription(offer)
        
        const answer = await pc.value.createAnswer();
        pc.value.setLocalDescription(answer);
        // sendcandidates();

        const RTCSignal: RTCSignal = {
            stream_id: stream.value.id,
            user: auth.user,
            conversation: signal.conversation,
            data: answer,
            audio: audio.value,
            video: video.value,
            screen: screen.value,
            negotiation: false,
        }
        streams.value.push({ stream: stream.value, signal: RTCSignal });
        ws.call(RTCSignal)
    }

    async function answer(signal: RTCSignal) {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        console.log('Answer:', signal);
        pc.value.setRemoteDescription(signal.data);
        sendcandidates();
    }

    function tracks() {
        if (!stream.value) throw new Error("Stream it's not initialized"); // This should never happen, just to satisfy TS
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        
        for (const track of stream.value.getTracks()) {
            pc.value.addTrack(track, stream.value)
        }
    }

    function remotestream() {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        pc.value.ontrack = (event) => {
            console.log('Track received:', event.track);
            console.log('Stream:', event.streams);
            
            const ids = streams.value.map(s => s.stream.id);
            for (const s of event.streams) {
                if (ids.includes(s.id)) continue;
                streams.value.push({ stream: s, signal: null });
            }

            event.streams.forEach(s => {
                s.onremovetrack = (event) => {
                    streams.value = streams.value.filter(stream => stream.stream.id != s.id);
                }
            });
        }
    }

    // Require the missing signals
    function requiresignal() {
        const ids = streams.value.filter(s => s.signal == null).map(s => s.stream.id);
        if (ids.length == 0) return;
        if (!auth.user) throw new Error("No user authenticated");

        const req: RTCSignalRequest = {
            ids: ids,
            user: auth.user,
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
        console.log('Syncing streams:', signal);
        console.log('Streams:', streams.value);
        for (const stream of streams.value) {
            if (stream.stream.id == signal.stream_id) stream.signal = signal;
        }
    }

    // Detect possible candidates 
    function icecandidates() {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        pc.value.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                // console.log('[ICE Candidate]', event.candidate);
                candidates.value.push(event.candidate)
            }
        }
    }

    function sendcandidates() {
        console.log('Checking candidates:', candidates.value);
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected"); // TODO : should select the conversation
        console.log('Sending candidates:', candidates.value);
        
        for (const candidate of candidates.value) {
            const c: RTCCandidate = {
                user: auth.user.id,
                conversation: conversation.conversation.id,
                candidate: candidate
            }
            ws.candidate(c)
        }
        candidates.value = [];
    }

    // Sending negotiation
    async function negotiate() {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        
        pc.value.onnegotiationneeded = async () => {
            if (!stream.value) throw new Error("No stream available"); // This should never happen, just to satisfy TS
            if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
            if (!auth.user) throw new Error("No user authenticated");
            if (!conversation.conversation) throw new Error("No conversation selected"); // TODO : should select the conversation
            if (streams.value.length == 0) return; // No remote streams available 
            
            const offer = await pc.value.createOffer();
            await pc.value.setLocalDescription(offer);
    
            const RTCSignal: RTCSignal = {
                stream_id: stream.value.id,
                user: auth.user,
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
        if (!stream.value) throw new Error("No stream available"); // This should never happen, just to satisfy TS
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        if (!auth.user) throw new Error("No user authenticated");
        const offer = new RTCSessionDescription(signal.data);
        pc.value.setRemoteDescription(offer)
        
        const answer = await pc.value.createAnswer();
        pc.value.setLocalDescription(answer);
        sendcandidates();


        const RTCSignal: RTCSignal = {
            stream_id: stream.value.id,
            user: auth.user,
            conversation: signal.conversation,
            data: answer,
            audio: audio.value,
            video: video.value,
            screen: screen.value,
            negotiation: true,
        }
        ws.call(RTCSignal, 'negotiation')
    }

    // Receiving Socket candidates
    async function candidate(candidate: RTCCandidate) {
        if (!pc.value) throw new Error("WebRTC it's not initialized");
        await pc.value.addIceCandidate(candidate.candidate);
    }

    function hangout() {
        if (!pc.value) throw new Error("WebRTC it's not initialized");
        pc.value.close();
        logout();
    }

    return {
        call,
        stream,
        audio,
        video,
        screen,
        streams,
        init,
        logout,
        signaling,
        offer,
        answer,
        candidate,
        negotiation,
        signalrequested,
        signal,
        hangout,
    }
});
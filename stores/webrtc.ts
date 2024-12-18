import { defineStore } from 'pinia';
import type { RTCCandidate } from '~/types/WebRTC/RTCCandidate';
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';
import type { RTCStream } from '~/types/WebRTC/RTCStream';

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
    const remoteStreams = ref<Map<string, MediaStream>>(new Map())
    const streams = ref<RTCStream[]>([]);
    
    const pc = ref<RTCPeerConnection | null>(null);
    const candidates = ref<RTCIceCandidate[]>([]);

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

            console.log(stream.value.getVideoTracks());
            

            const sender = pc.value.getSenders().find(sender => sender.track?.kind === 'video');
            if (sender) sender.replaceTrack(track);
            else pc.value.addTrack(track, stream.value);
        }
    });

    watch(() => screen.value, async (value) => {
        if (!pc.value) return;
        if (!stream.value) return;

        console.log('Screen:', value);
        if (value && video.value) {
            const tracks = stream.value.getVideoTracks();
            tracks.forEach(track => track.stop());
    
            for (const sender of pc.value.getSenders()) {
                if (sender.track?.kind === 'video') pc.value.removeTrack(sender);
            }
    
            for (const track of tracks) {
                stream.value.removeTrack(track);
            }

            const tmp = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (!tmp) return;
    
            const track = tmp.getVideoTracks()[0];
            stream.value.addTrack(track);
    
            const sender = pc.value.getSenders().find(sender => sender.track?.kind === 'video');
            if (sender) sender.replaceTrack(track);
            else pc.value.addTrack(track, stream.value);
        } else if (value && !video.value) {
            const tmp = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (!tmp) return;
    
            const track = tmp.getVideoTracks()[0];
            stream.value.addTrack(track);
    
            const sender = pc.value.getSenders().find(sender => sender.track?.kind === 'video');
            if (sender) sender.replaceTrack(track);
            else pc.value.addTrack(track, stream.value);
        } else if (!value && video.value) {
            const tracks = stream.value.getVideoTracks();
            tracks.forEach(track => track.stop());
    
            for (const sender of pc.value.getSenders()) {
                if (sender.track?.kind === 'video') pc.value.removeTrack(sender);
            }
    
            for (const track of tracks) {
                stream.value.removeTrack(track);
            }

            const tmp = await devices({ audio: false, video: true });
            if (!tmp) return;
    
            const track = tmp.getVideoTracks()[0];
            stream.value.addTrack(track);
    
            const sender = pc.value.getSenders().find(sender => sender.track?.kind === 'video');
            if (sender) sender.replaceTrack(track);
            else pc.value.addTrack(track, stream.value);
        } else {
            const tracks = stream.value.getVideoTracks();
            tracks.forEach(track => track.stop());
    
            for (const sender of pc.value.getSenders()) {
                if (sender.track?.kind === 'video') pc.value.removeTrack(sender);
            }
    
            for (const track of tracks) {
                stream.value.removeTrack(track);
            }
        }
    });

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
            
            tracks()
            remotestream()
            icecandidates()
            await negotiate()

            pc.value.onconnectionstatechange = (event) => {
                console.log(pc.value?.connectionState);
            }
            
            const offer = await pc.value.createOffer();
            await pc.value.setLocalDescription(offer);


            const RTCSignal: RTCSignal = { 
                stream_id: stream.value.id,
                user: auth.user,
                conversation: conversation.conversation.id, 
                data: offer,
                audio: audio.value,
                video: video.value,
                negotiation: false,
            };
            ws.call(RTCSignal);
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
        }
    }

    function logout() {
        if (stream.value) stream.value.getTracks().forEach(track => track.stop());
        // if (streams.value) streams.value.forEach(stream => stream.stream.getTracks().forEach(track => track.stop()));
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
        for (const stream of streams.value) {
            if (stream.stream.id == data.stream_id) stream.signal = data;
        }

        if (data.negotiation && data.data.type == "offer") negotiation(data);
        else if (data.data.type == "offer") incomingcall(data);
        else if (data.data.type == "answer") answer(data);
    }

    async function incomingcall(data: RTCSignal) {
        try {
            console.log('Incoming call:', data);
            call.value = data;
        } catch (error) {
            console.error('Error incoming call:', error);
        }
    }

    async function offer(signal: RTCSignal, options: { audio: boolean, video: boolean }) {
        console.log('Received offer:', signal);
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
            console.log(pc.value?.connectionState);
        }

        const offer = new RTCSessionDescription(signal.data);
        pc.value.setRemoteDescription(offer)
        
        const answer = await pc.value.createAnswer();
        pc.value.setLocalDescription(answer);
        sendcandidates();
        syncstreams(signal)

        const RTCSignal: RTCSignal = {
            stream_id: stream.value.id,
            user: auth.user,
            conversation: signal.conversation,
            data: answer,
            audio: audio.value,
            video: video.value,
            negotiation: false,
        }
        
        ws.call(RTCSignal)
    }

    async function answer(signal: RTCSignal) {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        pc.value.setRemoteDescription(signal.data).then(() => syncstreams(signal));
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
            const ids = streams.value.map(s => s.stream.id);
            for (const s of event.streams) {
                if (ids.includes(s.id)) return;
                streams.value.push({ stream: s, signal: null });
            }
        }
    }

    function syncstreams(signal: RTCSignal) {
        for (const stream of streams.value) {
            if (stream.stream.id == signal.stream_id) stream.signal = signal;
        }
    }

    // Detect possible candidates 
    function icecandidates() {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        pc.value.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                candidates.value.push(event.candidate)
            }
        }
    }

    function sendcandidates() {
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected"); // TODO : should select the conversation
        for (const candidate of candidates.value) {
            const c: RTCCandidate = {
                user: auth.user.id,
                conversation: conversation.conversation.id,
                candidate: candidate
            }
            ws.candidate(c)
        }
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
            // console.log('Negotiation needed');
            
            const offer = await pc.value.createOffer();
            await pc.value.setLocalDescription(offer);
    
            const RTCSignal: RTCSignal = {
                stream_id: stream.value.id,
                user: auth.user,
                conversation: conversation.conversation.id,
                data: offer,
                audio: audio.value,
                video: video.value,
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
        remoteStreams,
        streams,
        init,
        logout,
        signaling,
        offer,
        answer,
        candidate,
        negotiation,
        hangout,
    }
});
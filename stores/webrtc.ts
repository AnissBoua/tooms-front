import { defineStore } from 'pinia';
import type { RTCCandidate } from '~/types/WebRTC/RTCCandidate';
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';

export const useWebRTCStore = defineStore('rtc', () => {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
    const stream = ref<MediaStream | null>(null);
    const pc = ref<RTCPeerConnection | null>(null);
    const candidates = ref<RTCIceCandidate[]>([]);
    const remoteStreams = ref<Map<string, MediaStream>>(new Map())
    const ws = useWebSocketStore()
    const conversation = useConversationStore();
    const auth = useAuthStore();

    async function init() {
        try {
            if (!conversation.conversation) throw new Error('No conversation selected'); // This should never happen
            if (!auth.user) throw new Error('No user authenticated'); // This should never happen

            stream.value = await devices({ audio: true, video: true });

            pc.value = new RTCPeerConnection(configuration);
            
            tracks()
            remotestream()
            icecandidates()

            pc.value.onconnectionstatechange = (event) => {
                console.log(pc.value?.connectionState);
            }
            
            const offer = await pc.value.createOffer();
            await pc.value.setLocalDescription(offer);


            const RTCSignal: RTCSignal = { 
                user: auth.user.id,
                conversation: conversation.conversation.id, 
                data: offer 
            };
            ws.call(RTCSignal);
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
        }
    }

    function logout() {
        if (stream.value) stream.value.getTracks().forEach(track => track.stop());
        if (pc.value) pc.value.close();
        stream.value = null;
        pc.value = null;
        candidates.value = [];
        remoteStreams.value = new Map();
    }

    async function devices(constraints: { audio: boolean, video: any }) {
        return await navigator.mediaDevices.getUserMedia(constraints);
    }

    function signaling(data: RTCSignal) {
        if (data.data.type == "offer") offer(data);
        else if (data.data.type == "answer") answer(data);
    }

    async function offer(signal: RTCSignal) {
        console.log('Received offer:', signal);
        if (!auth.user) throw new Error("No user authenticated");
        if (!conversation.conversation) throw new Error("No conversation selected"); // TODO : should select the conversation
        stream.value = await devices({ audio: true, video: true });
        pc.value = new RTCPeerConnection(configuration);

        tracks()
        remotestream()
        icecandidates()
        pc.value.onconnectionstatechange = (event) => {
            console.log(pc.value?.connectionState);
        }

        const offer = new RTCSessionDescription(signal.data);
        pc.value.setRemoteDescription(offer)
        
        const answer = await pc.value.createAnswer();
        pc.value.setLocalDescription(answer);
        sendcandidates();

        const RTCSignal: RTCSignal = {
            user: auth.user.id,
            conversation: signal.conversation,
            data: answer
        }
        ws.call(RTCSignal)
    }

    function answer(signal: RTCSignal) {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        console.log('Received answer:', signal);
        pc.value.setRemoteDescription(signal.data)
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
            const streams = event.streams;
            for (const s of streams) {
                if (remoteStreams.value.has(s.id)) return;
                remoteStreams.value.set(s.id, s)
                console.log(remoteStreams.value);
            }
        }
    }

    // Detect possible candidates 
    function icecandidates() {
        if (!pc.value) throw new Error("WebRTC it's not initialized"); // This should never happen, just to satisfy TS
        pc.value.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                // console.log(event.candidate);
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

    // Receiving Socket candidates
    async function candidate(candidate: RTCCandidate) {
        if (!pc.value) throw new Error("WebRTC it's not initialized");
        await pc.value.addIceCandidate(candidate.candidate);
    }

    return {
        stream,
        remoteStreams,
        init,
        logout,
        signaling,
        offer,
        answer,
        candidate,
    }
});
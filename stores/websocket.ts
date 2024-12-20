import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from "socket.io-client";
import type { WSMsg } from "~/types/WSmsg";
import type { Message } from "~/types/message";
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';
import type { RTCCandidate } from '~/types/WebRTC/RTCCandidate';
import type { RTCSignalRequest } from '~/types/WebRTC/RTCSignalRequest';

export const useWebSocketStore = defineStore('ws', () => {
    const socket = ref<Socket | null>(null);
    const auth = useAuthStore();
    const conversation = useConversationStore();
    const rtc = useWebRTCStore();
    const status = ref<'disconnected' | 'connected' | 'authenticated'>('disconnected');

    async function init() {
        if (!socket.value) {
            const config = useRuntimeConfig();
            socket.value = io(config.public.WS_URL);
        }

        socket.value.on("connect", () => {
            status.value = 'connected';
            console.log("Connecting to websocket");
            
            if (!auth.token) throw new Error("No token available");
            if (!socket.value) return; // This should never happen, just to satisfy TS

            socket.value.emit("login", "Bearer " + auth.token);
        });

        socket.value.on("disconnect", () => {
            console.log("Disconnected from WebSocket server");
            status.value = 'disconnected';
            socket.value = null;
        });

        socket.value.on("error", (error: any) => {
            console.error("WebSocket error:", error);
        });

        socket.value.on("authenticated", (user: number) => {
            console.log("Authenticated with user ID:", user);
            status.value = 'authenticated';
        });

        socket.value.on("message", (data: Message) => {
            console.log("Received message:", data);

            if (!conversation.conversation) return;
            if (data.conversation.id !== conversation.conversation.id) return;
            
            conversation.addMessage(data);
        });

        socket.value.on("call", (signal: RTCSignal) => {
            rtc.signaling(signal);
        });

        socket.value.on("candidate", (candidate: RTCCandidate) => {
            rtc.candidate(candidate);
        })

        socket.value.on("negotiation", (signal: RTCSignal) => {
            rtc.signaling(signal);
        })

        socket.value.on("require-signal", (signal: RTCSignalRequest) => {
            rtc.signalrequested(signal);
        })

        socket.value.on("signal", (signal: RTCSignal) => {
            rtc.signal(signal);
        })
    }

    function logout() {
        if (!socket.value) return;
        socket.value.disconnect();
        socket.value = null;
        status.value = 'disconnected';
    }

    function send(data: any) {
        if (!socket.value) return;
        if (!auth.user) return;
        if (!conversation.conversation) return;

        const msg: WSMsg = {
            conversation: conversation.conversation.id,
            content: data,
            user: auth.user.id,
        }
        socket.value.emit("message", msg);
    }

    function call(offer: RTCSignal | RTCSignalRequest, event: string = 'call') {
        if (!socket.value) throw new Error("Socket not initialized");
        socket.value.emit(event, offer)
    }

    function candidate(data: RTCCandidate) {
        if (!socket.value) throw new Error("Socket not initialized");
        socket.value.emit('candidate', data);
    }

    return {
        socket,
        status,
        init,
        logout,
        send,
        call,
        candidate,
    }
});
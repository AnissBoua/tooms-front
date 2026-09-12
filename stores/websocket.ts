import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from "socket.io-client";
import type { WSMsg } from "~/types/WSmsg";
import type { Message } from "~/types/message";
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';
import type { RTCCandidate } from '~/types/WebRTC/RTCCandidate';
import type { RTCSignalRequest } from '~/types/WebRTC/RTCSignalRequest';
import type { RTCConnected } from '~/types/WebRTC/RTCConnected';
import type { RTCBase } from '~/types/WebRTC/RTCBase';

export const useWebSocketStore = defineStore('ws', () => {
    const socket = ref<Socket | null>(null);
    const auth = useAuthStore();
    const conversation = useConversationStore();
    const rtc = useWebRTCStore();
    const status = ref<'disconnected' | 'connected' | 'authenticated'>('disconnected');
    const online = ref<Set<number>>(new Set());

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
            online.value = new Set();
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

            const isMine = !!auth.user && data.user.id === auth.user.id;
            const isOpen = conversation.conversation?.id === data.conversation.id;
            // Applies to the conversation's message list (open or not) and its sidebar preview.
            conversation.receiveMessage(data, !isMine && !isOpen);
        });

        socket.value.on("read", (data: { conversation: number; user: number; at: string }) => {
            conversation.applyRead(data.conversation, data.user, data.at);
        });

        socket.value.on("presence-snapshot", (ids: number[]) => {
            online.value = new Set(ids);
        });

        socket.value.on("presence", (data: { user: number; online: boolean }) => {
            const next = new Set(online.value);
            if (data.online) next.add(data.user); else next.delete(data.user);
            online.value = next;
        });

        socket.value.on("call", (signal: RTCSignal) => {
            rtc.signaling(signal);
        });

        socket.value.on("refuse", (signal: RTCSignal) => {
            rtc.refused(signal);
        });

        socket.value.on("hangout", (data: { user: number; conversation: number }) => {
            rtc.peerleft(data.user);
        });

        socket.value.on("multi-call", (users: number[]) => {
            rtc.secondarycalls(users);
        });

        socket.value.on("trigger-candidates", (data: RTCBase) => {
            rtc.sendcandidates(data);
        })

        socket.value.on("candidates", (candidate: RTCCandidate) => {
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

        socket.value.on("connected", (users: number[]) => {
            rtc.secondarycalls(users);
        })
    }

    function logout() {
        online.value = new Set();
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

    function call(offer: RTCSignal | RTCCandidate | RTCSignalRequest | RTCConnected | RTCBase, event: string = 'call') {
        if (!socket.value) throw new Error("Socket not initialized");
        socket.value.emit(event, offer)
    }

    return {
        socket,
        status,
        online,
        init,
        logout,
        send,
        call,
    }
});
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from "socket.io-client";
import type { WSMsg } from "~/types/WSmsg";
import type { Message } from "~/types/message";

export const useWebSocketStore = defineStore('ws', () => {
    const socket = ref<Socket | null>(null);
    const auth = useAuthStore();
    const conversation = useConversationStore();
    // disconnected, connected, authenticated
    const status = ref<'disconnected' | 'connected' | 'authenticated'>('disconnected');

    // In case the authentication does not happen after the connection
    watch(() => auth.token, (token) => {
        if (status.value === 'authenticated') return;
        if (!socket.value) return;
        if (!token) return;
        console.log("Emitting login event");
        socket.value.emit("login", "Bearer " + token);
    });

    async function init() {
        if (!socket.value) {
            const config = useRuntimeConfig();
            socket.value = io(config.public.WS_URL);
        }

        socket.value.on("connect", () => {
            status.value = 'connected';
            if (!auth.token) return;
            if (!socket.value) return;
            socket.value.emit("login", "Bearer " + auth.token);

        });

        socket.value.on("disconnect", () => {
            console.log("Disconnected from WebSocket server");
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
    }

    async function send(data: any) {
        if (!socket.value) return; 
        if (!auth.user) return;
        if (!conversation.conversation) return
        const msg: WSMsg = {
            conversation: conversation.conversation.id,
            content: data,
            user: auth.user.id,
        }
        socket.value.emit("message", msg);
    }

    return {
        socket,
        status,
        init,
        send,
    }
});
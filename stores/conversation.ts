import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Conversation } from "~/types/conversation";
import type { Message } from '~/types/message';
import type { User } from '~/types/user';

export const useConversationStore = defineStore('conversation', () => {
    const conversations = ref<Conversation[]>([]);
    const conversation = ref<Conversation | null>(null);
    const auth = useAuthStore();

    async function get() {
        try {
            const config = useRuntimeConfig();
            const data = await $fetch<Conversation[]>(config.public.API_URL + '/api/conversations', {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });

            conversations.value = data;
        } catch (error) {
            console.error('CONVERSATION::STORE::GET');
            console.error(error);
        }
    }

    async function messages(page: number) {
        if (!conversation.value) return;
        try {
            const config = useRuntimeConfig();
            const data = await $fetch<Message[]>(config.public.API_URL + `/api/conversations/${conversation.value?.id}/messages?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });

            conversation.value.messages.push(...data);
        } catch (error) {
            console.error('CONVERSATION::STORE::MESSAGES');
            console.error(error);
        }
    }

    function addMessage(message: Message) {
        if (!conversation.value) return;
        conversation.value.messages.push(message);
    }

    function initials(user: User) {
        return user.name.charAt(0).toUpperCase() + user.lastname.charAt(0).toUpperCase();
    }

    return {
        conversations,
        conversation,
        get,
        messages,
        addMessage,
        initials,
    }
});
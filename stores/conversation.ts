import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Conversation } from "~/types/conversation";
import type { Message } from '~/types/message';
import type { User } from '~/types/user';

export const useConversationStore = defineStore('conversation', () => {
    const conversations = ref<Conversation[]>([]);
    const conversation = ref<Conversation | null>(null);

    function logout() {
        conversation.value = null;
        conversations.value = [];
    }

    async function get() {
        try {
            const data = await useInterceptorFetch<Conversation[]>('/api/conversations');
            data.forEach(conversation => conversation.page = 1);

            conversations.value = data;
        } catch (error) {
            console.error('CONVERSATION::STORE::GET');
            console.error(error);
        }
    }

    async function one(id: number) {
        try {
            const data = await useInterceptorFetch<Conversation>('/api/conversations/' + id);
            data.page = 1;
            
            return data;
        } catch (error) {
            console.error('CONVERSATION::STORE::ONE');
            console.error(error);
        }

        return null;
    }

    async function messages(page: number) {
        if (!conversation.value) return;
        try {
            const data = await useInterceptorFetch<Message[]>(`/api/conversations/${conversation.value?.id}/messages?page=${page}`);
            conversation.value.messages.unshift(...data);
        } catch (error) {
            console.error('CONVERSATION::STORE::MESSAGES');
            console.error(error);
        }
    }

    async function search(search: string) {
        try {
            const data = await useInterceptorFetch<User[]>(`/api/users/search?search=${search}`);
            return data;
        } catch (error) {
            console.error('CONVERSATION::STORE::SEARCH');
            console.error(error);
        }

        return [];
    }

    async function create( data: { name: string, users: User[]}) {
        try {
            const req = {
                name: data.name,
                users: data.users.map(user => user.id),
            }
            
            const res = await useInterceptorFetch<Conversation>('/api/conversations', {
                method: 'POST',
                body: req,
            });

            conversations.value.push(res);
        } catch (error) {
            console.error('CONVERSATION::STORE::CREATE');
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
        logout,
        get,
        one,
        messages,
        search,
        create,
        addMessage,
        initials,
    }
});
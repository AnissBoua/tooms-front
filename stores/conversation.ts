import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Conversation } from "~/types/conversation";
import type { Message } from '~/types/message';
import type { User } from '~/types/user';

export const useConversationStore = defineStore('conversation', () => {
    const conversations = ref<Conversation[]>([]);
    const conversation = ref<Conversation | null>(null);
    
    // Used to determine if the mobile conversation is selected
    const mobile = ref<boolean>(false);

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

            const existingIds = new Set(conversation.value.messages.map(m => m.id));
            const fresh = data.filter(m => !existingIds.has(m.id));
            conversation.value.messages.unshift(...fresh);
            conversation.value.loaded = true;
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

    async function create( data: { name?: string, users: User[]}) {
        try {
            const req = {
                name: data.name || undefined,
                users: data.users.map(user => user.id),
            }

            const res = await useInterceptorFetch<Conversation>('/api/conversations', {
                method: 'POST',
                body: req,
            });

            res.messages = res.messages ?? [];
            res.page = 1;
            conversations.value.push(res);

            return res;
        } catch (error) {
            console.error('CONVERSATION::STORE::CREATE');
            console.error(error);
        }

        return null;
    }

    function addMessage(message: Message) {
        if (!conversation.value) return;
        conversation.value.messages.push(message);
        conversation.value.lastMessage = message;
    }

    function receiveMessage(message: Message, incrementUnread: boolean = false) {
        const targets = new Set<Conversation>();
        const listed = conversations.value.find(c => c.id === message.conversation.id);
        if (listed) targets.add(listed);
        if (conversation.value && conversation.value.id === message.conversation.id) targets.add(conversation.value);

        for (const conv of targets) {
            conv.lastMessage = message;
            if (!conv.messages.some(m => m.id === message.id)) conv.messages.push(message);
            if (incrementUnread) conv.unread = (conv.unread ?? 0) + 1;
        }
    }

    async function markRead(id: number) {
        const match = conversations.value.find(c => c.id === id);
        if (match) match.unread = 0;

        try {
            await useInterceptorFetch(`/api/conversations/${id}/read`, { method: 'PUT' });
        } catch (error) {
            console.error('CONVERSATION::STORE::MARK_READ');
            console.error(error);
        }
    }

    function applyRead(conversationId: number, userId: number, at: string) {
        const targets = [conversations.value.find(c => c.id === conversationId)];
        if (conversation.value?.id === conversationId) targets.push(conversation.value);

        for (const conv of targets) {
            if (!conv) continue;
            conv.readReceipts = conv.readReceipts ?? [];
            const existing = conv.readReceipts.find(r => r.user === userId);
            if (existing) existing.last_read_at = at;
            else conv.readReceipts.push({ user: userId, last_read_at: at });
        }
    }

    function initials(user: User) {
        return user.name.charAt(0).toUpperCase() + user.lastname.charAt(0).toUpperCase();
    }

    return {
        conversations,
        conversation,
        mobile,
        logout,
        get,
        one,
        messages,
        search,
        create,
        addMessage,
        receiveMessage,
        markRead,
        applyRead,
        initials,
    }
});
<template>
    <div v-if="store.conversation" class="h-full flex flex-col justify-end ">
        <div class="overflow-y-scroll space-y-6 p-2 custom-scrollbar" ref="messages">
            <template v-for="(msg, index) in store.conversation.messages" :key="msg.id">
                <Message :message="msg" :prev_user="prev_user(index)" />
            </template>
        </div>
        <div class="flex space-x-4 p-2">
            <Input @update:input="message = $event" @enter="send" :input="message" name="message" id="message" placeholder="Your message" icon="solar:chat-round-outline" />
            <Button @click="send" class="flex items-center justify-center !w-20 !p-0"><Icon name="lets-icons:send-light" class="text-3xl" /></Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message';

const auth = useAuthStore();
const store = useConversationStore();
const ws = useWebSocketStore();
const message = ref<string>('');
const messages = ref<HTMLElement | null>(null);
const scroll = ref<number>(0);

watch(() => store.conversation, (conversation) => {
    if (!conversation) return;
    if (!conversation.messages.length) {
        store.messages(1);
    }
});

// Scroll to bottom when new message is added
watch(() => store.conversation?.messages, async (message_list) => {
    if (!message_list) return;
    if (!messages.value) return;
    await nextTick();
    
    if (messages.value.scrollTop + messages.value.clientHeight >= scroll.value) {
        messages.value.scrollTo(0, messages.value.scrollHeight);
    }

    scroll.value = messages.value.scrollHeight;
}, { deep: true });

const prev_user = (index: number) => {
    if (index === 0) return null;
    if (!store.conversation) return null;
    return store.conversation.messages[index - 1].user;
}

const send = () => {
    if (!message.value) return;
    if (!store.conversation) return;
    if (!auth.user) return;
    const msg: Message = {
        id: 0,
        user: auth.user,
        content: message.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation: store.conversation
    };
    store.addMessage(msg);
    ws.send(message.value);

    message.value = '';
}
</script>

<style>
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #4B5563;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background-color: #2D3748;
}
</style>
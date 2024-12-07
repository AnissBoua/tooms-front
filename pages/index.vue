<template>
    <div v-if="store.conversation" class="h-full flex flex-col justify-end ">
        <div class="overflow-y-scroll space-y-6 p-2 custom-scrollbar">
            <template v-for="(msg, index) in store.conversation.messages" :key="msg.id">
                <Message :message="msg" :prev_user="prev_user(index)" />
            </template>
        </div>
        <div class="p-2">
            <Input />
        </div>
    </div>
</template>

<script setup lang="ts">
const store = useConversationStore();

watch(() => store.conversation, (conversation) => {
    console.log(conversation);
    if (conversation && !conversation.messages.length) {
        store.messages(1);
    }
});

const prev_user = (index: number) => {
    if (index === 0) return null;
    if (!store.conversation) return null;
    return store.conversation.messages[index - 1].user;
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
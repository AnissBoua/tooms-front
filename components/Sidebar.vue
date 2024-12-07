<template>
    <div class="space-y-4 p-4">
        <div class="flex items-center justify-between">
            <p>Conversation</p>
            <Icon name="hugeicons:message-multiple-01" class="text-2xl" />
        </div>
        <div>
            <template v-for="(conversation) in store.conversations" :key="conversation.id">
                <Conversation :conversation="conversation"/>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
const store = useConversationStore();

onMounted(() => {
    store.get();
});
</script>
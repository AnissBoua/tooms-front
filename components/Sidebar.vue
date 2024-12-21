<template>
    <div class="h-full flex flex-col justify-between space-y-4 p-4">
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <p>Conversation</p>
                <Icon name="hugeicons:message-add-01" class="text-2xl hover:text-violet-600 cursor-pointer" @click="searching = true" />
                <div v-if="searching" class="fixed z-10 inset-0 bg-black/50">
                    <CreateConversation />
                </div>
            </div>
            <div class="space-y-2">
                <template v-for="(conversation) in store.conversations" :key="conversation.id">
                    <Conversation :conversation="conversation"/>
                </template>
            </div>
        </div>
        <div @click="logout" class="flex items-center justify-between bg-red-800/20 text-red-500 hover:bg-red-800/30 hover:text-red-600 rounded-lg px-4 py-2 cursor-pointer">
            <p>Deconnexion</p>
            <Icon name="solar:logout-2-outline" class="text-2xl" />
        </div>
    </div>
</template>

<script setup lang="ts">
import CreateConversation from './modals/CreateConversation.vue';

const auth = useAuthStore();
const store = useConversationStore();
const searching = ref(false);
const search = ref('');
const contacts = ref<ReturnType<typeof store.search> | null>(null);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

watch(() => auth.user, (user) => {
    if (!user) return;
    if (store.conversations.length) return;
    store.get();
});

watch(() => search.value, (value) => {
    if (!value) return;
    if (timer.value) clearTimeout(timer.value);
    timer.value = setTimeout(() => {
        contacts.value = store.search(value);
    }, 500);
});

onMounted(() => {
    if (!auth.user) return;
    if (store.conversations.length) return;
    store.get();
});

const logout = () => {
    auth.logout();
}
</script>
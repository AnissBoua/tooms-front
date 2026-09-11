<template>
    <div class="chat-shell relative flex h-screen overflow-x-hidden">
        <div v-if="!isPublic" class="w-full md:w-1/3 lg:w-1/4 border-r border-neutral-800">
            <Sidebar />
        </div>
        <div class="absolute z-10 w-full md:static flex-1 transition-all duration-200 ease-in-out" :class="{'left-full': auth.user && !conversation.mobile, 'left-0': conversation.mobile}">
            <slot />
        </div>
        <div v-if="incoming" class="fixed z-10 top-0 left-0 right-0 w-max mx-auto">
            <IncomingCall :signal="incoming" @close="incoming = null" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';

const auth = useAuthStore();
const rtc = useWebRTCStore();
const conversation = useConversationStore();

const route = useRoute();
// The homepage and auth pages are public; only the chat app itself requires a session
const isPublic = computed<Boolean>(() => route.path === '/' || route.path.includes('/auth'));

const incoming = ref<RTCSignal | null>(null);

onMounted(() => {
  if (!auth.token && !isPublic.value) navigateTo('/auth/login');
});

watch(() => rtc.call, (call) => {
    if (!call) return;
    if (call.data.type == "offer") {
        incoming.value = call;
    }
});
</script>

<style scoped>
/* Shared design tokens for the redesigned chat UI (Sidebar, conversation page, modals) -
   defined here so every descendant component can read them via var(--x), since Sidebar
   and the page <slot> are siblings rather than parent/child. */
.chat-shell {
    --bg: oklch(0.17 0.012 285);
    --bg-alt: oklch(0.185 0.013 286);
    --surface: oklch(0.21 0.014 288);
    --border: oklch(0.24 0.016 289);
    --border-soft: oklch(0.28 0.018 290);
    --border-strong: oklch(0.30 0.02 290);
    --text: oklch(0.96 0.005 285);
    --text-dim: oklch(0.74 0.012 285);
    --text-dimmer: oklch(0.60 0.012 285);
    --accent: oklch(0.55 0.22 295);
    --accent-hover: oklch(0.60 0.22 295);
    --accent-soft: oklch(0.24 0.05 295);
    --accent-soft-border: oklch(0.36 0.09 295);
    --accent-soft-strong: oklch(0.28 0.07 295);
    --accent-soft-strong-border: oklch(0.42 0.10 295);
    --accent-text: oklch(0.85 0.08 295);
    --error: oklch(0.72 0.17 25);
    background: var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', system-ui, sans-serif;
}
</style>
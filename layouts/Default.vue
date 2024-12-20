<template>
    <div class="flex h-screen">
        <div v-if="!isAuth" class="w-1/4 bg-neutral-950 border-r border-neutral-800">
            <Sidebar />
        </div>
        <div class="flex-1">
            <slot />
        </div>
        <div v-if="incoming" class="fixed top-0 left-0 right-0 w-max mx-auto">
            <IncomingCall :signal="incoming" @close="incoming = null" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';

const auth = useAuthStore();
const rtc = useWebRTCStore();

const route = useRoute();
const isAuth = computed<Boolean>(() => route.path.includes('/auth'));

const incoming = ref<RTCSignal | null>(null);

onMounted(() => {
  if (!auth.token && !route.path.includes('/auth')) navigateTo('/auth/login');
});

watch(() => rtc.call, (call) => {
    if (!call) return;
    if (call.data.type == "offer") {
        incoming.value = call;
    }
});
</script>
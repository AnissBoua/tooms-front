<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-black text-sm'
  }
})

const auth = useAuthStore();
const ws = useWebSocketStore();
const rtc = useWebRTCStore();
watch(() => auth.token, (token) => {
  if (!token) return;
  if (ws.status == "connected") return;
  ws.init();
});

onMounted(() => {
  // When a call is incoming the ringtone can be played only if the user have interacted with the page
  document.addEventListener('click', () => {
    if (rtc.ringtone) return;
    rtc.ringtone = true;
  });
});
</script>
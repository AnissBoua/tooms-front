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
watch(() => auth.token, (token) => {
  if (!token) return;
  if (ws.status == "connected") return;
  ws.init();
});
</script>

<style>
body {
    font-family: 'Poppins', sans-serif;
}
</style>
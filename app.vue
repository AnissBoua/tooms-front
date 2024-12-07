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

const ws = useWebSocketStore();
onMounted(() => {
  ws.init();
});
</script>

<style>
body {
    font-family: 'Poppins', sans-serif;
}
</style>
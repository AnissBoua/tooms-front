<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// SETUP
useHead({
  bodyAttrs: {
    class: 'bg-black text-sm'
  }
})
</script>

<style>
body {
    font-family: 'Poppins', sans-serif;
}
</style>
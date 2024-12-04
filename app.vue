<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const auth = useAuthStore();
auth.token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzMyNzQ4MTg5LCJleHAiOjE3MzI3NTE3ODl9.oOJpzd3hIZkuaDNW8QScqXM0PTWcOBloQDBkUo-sqINL7m5-ivGGINAv5TwiEyH8rMUexA_9BRi8nath35Ecs5fs4ntaxbDde3RqWXRhuLaYtaOkF48KiQalMkcxNNWqbZzftDwyTsiTX_Ut_bT6nqinuU43XPhO-ARzx03vI5zu-n4a_Y2y1rKah82OhxGPnuj4N2HtWitIEveCcn7a-MPMNi6t2-WUj67xz6-WZxjdkUJe6F_H_rZkqfxjEuGyYFQ3h2croMp8rfUputO46BASuixtOje-27E1eLUFOqmlb94l5owhTxDVXRf5Lu8w0IQouF4doe4dTm4C_BdTrw';
await useAsyncData('test', async () => auth.whoami().then(() => true));
if (!auth.user && route.path !== '/login') {
  navigateTo('/login');
}
</script>

<style>
body {
    font-family: 'Poppins', sans-serif;
}
</style>
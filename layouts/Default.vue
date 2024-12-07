<template>
    <div class="flex h-screen">
        <div v-if="!isAuth" class="w-1/6 border-r border-neutral-800">
            <Sidebar />
        </div>
        <div class="flex-1">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const route = useRoute();
const isAuth = computed<Boolean>(() => route.path.includes('/auth'));

onMounted(() => {
  if (!auth.token && !route.path.includes('/auth')) navigateTo('/auth/login');
});
</script>
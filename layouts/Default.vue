<template>
    <div class="flex">
        <div class="w-1/6">
            <Sidebar />
        </div>
        <div class="flex-1">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
// const runtime = useRuntimeConfig();
// const {data: conversations} = await useFetch(runtime.public.API_URL + '/api/conversations');
// console.log(conversations);
</script>
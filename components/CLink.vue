<template>
    <nuxt-link :to="to" class="text-violet-800 hover:text-violet-700">
        <slot></slot>
    </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps({
    to: {
        type: String,
        default: '/',
    }
});
</script>
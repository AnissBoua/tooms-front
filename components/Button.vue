<template>
    <button class="w-full bg-gradient-to-t from-violet-900 to-violet-600 hover:from-violet-800 hover:to-violet-500 text-neutral-50 rounded-lg px-2 py-3" @click="$emit('click')">
        <slot></slot>
    </button>
</template>

<script setup lang="ts">
const props = defineProps({
    type: {
        type: String,
        default: 'button'
    }
});

const emit = defineEmits(['click']);
</script>
<template>
    <div @click="$emit('select', user)" class="flex items-center hover:bg-violet-900/30 rounded-md cursor-pointer space-x-2 px-3 py-2">
        <div v-if="user" class="flex items-center justify-center w-10 h-10 bg-violet-800/50 rounded-full text-violet-300"> {{ store.initials(user) }} </div>
        <p v-if="!minimized" class="text-sm text-neutral-200"> {{ user.name + ' ' + user.lastname }} </p>
    </div>
</template>

<script setup lang="ts">
import type { User } from '~/types/user';

const props = defineProps<{
    user: User;
    minimized: boolean;
}>();
const store = useConversationStore();

const emit = defineEmits(['select']);
</script>
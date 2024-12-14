<template>
    <div @click="select" class="flex items-center hover:bg-violet-900/30 rounded-md cursor-pointer space-x-2 px-3 py-2" :class="{'bg-violet-900/30 ring-1 ring-violet-800/50': isSelected}">
        <div v-if="user" class="flex items-center justify-center w-10 h-10 bg-violet-800/50 rounded-full text-violet-300"> {{ store.initials(user) }} </div>
        <p class="text-sm text-neutral-200"> {{ conversation.name || name() }} </p>
    </div>
</template>

<script setup lang="ts">
import type { Conversation } from '~/types/conversation';

const props = defineProps<{
    conversation: Conversation;
}>();
const auth = useAuthStore();
const store = useConversationStore();


const isSelected = computed<Boolean>(() => {
    return store.conversation?.id === props.conversation.id;
});

const user = computed(() => {
    if (!auth.user) return null;
    const id = auth.user.id;
    const notMe = props.conversation.participants.filter((participant) => participant.id !== id);
    return notMe[0];
});

const name = () => {
    if (!auth.user) return;
    const id = auth.user.id;
    const notMe = props.conversation.participants.filter((participant) => participant.id !== id);

    let name: string = ''; 
    for (const [index, participant] of notMe.entries()) {
        name += participant.name + ' ' + participant.lastname;
        if (index < notMe.length - 1) name += ', ';
        if (index === 2) {
            name += '...';
            break;
        }
    }

    return name;
}

const select = () => {
    store.conversation = props.conversation;
}
</script>
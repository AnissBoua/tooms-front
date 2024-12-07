<template>
    <div class="flex flex-col items-start space-y-1" :class="{'items-end': isMe}">
        <div class="flex flex-col-reverse gap-2" :class="{'items-end': isMe}">
            <div class="max-w-xl bg-gradient-to-tr from-neutral-900 to-neutral-800 rounded-xl rounded-tl-none px-4 py-2 " :class="{'!bg-gradient-to-tl from-violet-900 to-violet-700 rounded-tl-xl rounded-tr-none': isMe}">
                <p>{{ message.content }} </p>
            </div>
            <div v-if="!prev_user || message.user.id != prev_user.id">
                <div class="flex items-center justify-center w-10 h-10 bg-violet-800/50 rounded-full text-violet-300"> {{ conversation.initials(message.user) }} </div>
            </div>
        </div>
        <p class="text-xs text-neutral-400">{{ dayjs(message.created_at).fromNow() }}</p>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { User } from '~/types/user';
dayjs.extend(relativeTime);

const auth = useAuthStore();
const conversation = useConversationStore();
const props = defineProps<{
    message: Message;
    prev_user: User | null;
}>();

const isMe = computed<Boolean>(() => {
    if (!auth.user) return false;
    return props.message.user.id === auth.user.id;
});
</script>
<template>
    <button type="button" @click="select" class="row" :class="{ active: isSelected }">
        <span class="avatar" :class="{ active: isSelected }">{{ initials }}</span>
        <span class="body">
            <span class="line1">
                <span class="name">{{ conversation.name || name() }}</span>
                <span class="time mono">{{ time }}</span>
            </span>
            <span class="line2">
                <span class="preview">{{ preview }}</span>
            </span>
        </span>
    </button>
</template>

<script setup lang="ts">
import type { Conversation } from '~/types/conversation';
import dayjs from 'dayjs';

const props = defineProps<{
    conversation: Conversation;
}>();
const auth = useAuthStore();
const store = useConversationStore();

const isSelected = computed<boolean>(() => {
    return store.conversation?.id === props.conversation.id;
});

const isGroup = computed<boolean>(() => props.conversation.participants.length > 2);

const other = computed(() => {
    if (!auth.user) return null;
    const id = auth.user.id;
    const notMe = props.conversation.participants.filter((participant) => participant.id !== id);
    return notMe[0] ?? null;
});

const initials = computed(() => {
    if (isGroup.value) return 'G' + props.conversation.participants.length;
    if (!other.value) return '';
    return store.initials(other.value);
});

const name = () => {
    if (!auth.user) return '';
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

// No read/unread tracking exists yet (TODO), so the preview is just the latest message content.
const preview = computed(() => {
    const last = props.conversation.lastMessage;
    if (!last) return 'No messages yet';
    const mine = auth.user && last.user.id === auth.user.id;
    return (mine ? 'You: ' : '') + last.content;
});

const time = computed(() => {
    const last = props.conversation.lastMessage;
    if (!last) return '';

    const d = dayjs(last.created_at);
    const now = dayjs();
    if (d.isSame(now, 'day')) return d.format('HH:mm');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
    if (d.isSame(now, 'week')) return d.format('ddd');
    return d.format('D MMM');
});

const select = () => {
    store.conversation = props.conversation;
    store.mobile = true;
}
</script>

<style scoped>
.row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px;
    border-radius: 11px;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    border: 1px solid transparent;
    background: transparent;
    color: inherit;
}

.row:hover {
    background: oklch(0.21 0.014 288 / 0.6);
}

.row.active {
    border-color: oklch(0.34 0.05 292);
    background: oklch(0.235 0.03 291);
}

.avatar {
    flex: none;
    width: 38px;
    height: 38px;
    border-radius: 99px;
    display: grid;
    place-items: center;
    font-size: 12.5px;
    font-weight: 600;
    background: oklch(0.245 0.02 290);
    border: 1px solid var(--border-strong);
    color: oklch(0.84 0.01 285);
}

.avatar.active {
    background: var(--accent-soft-strong);
    border-color: var(--accent-soft-strong-border);
    color: var(--accent-text);
}

.body {
    min-width: 0;
    flex: 1;
    display: grid;
    gap: 3px;
}

.line1 {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.name {
    font-size: 14.5px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.time {
    margin-left: auto;
    flex: none;
    font-size: 10.5px;
    color: var(--text-dimmer);
}

.mono {
    font-family: 'IBM Plex Mono', monospace;
}

.line2 {
    display: flex;
    align-items: center;
    gap: 8px;
}

.preview {
    font-size: 13px;
    color: oklch(0.66 0.012 285);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

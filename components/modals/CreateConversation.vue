<template>
    <div class="panel" @click.stop>
        <div class="panel-head">
            <span class="panel-head-text">
                <span class="panel-title">New conversation</span>
                <span class="panel-subtitle mono">{{ pickedLabel }}</span>
            </span>
            <button type="button" title="Close" aria-label="Close" class="icon-btn" @click="close">
                <Icon name="tabler:x" />
            </button>
        </div>

        <div class="panel-search">
            <div class="search-field">
                <Icon name="tabler:search" class="search-icon" />
                <input v-model="search" type="text" placeholder="Search contacts" class="search-input" />
            </div>
        </div>

        <div class="panel-list">
            <button v-for="contact in contacts" :key="contact.id" type="button" class="contact-row" :class="{ picked: isPicked(contact) }" @click="toggle(contact)">
                <span class="contact-avatar">{{ store.initials(contact) }}</span>
                <span class="contact-body">
                    <span class="contact-name">{{ contact.name }} {{ contact.lastname }}</span>
                    <span class="contact-note mono">{{ note(contact) }}</span>
                </span>
                <span class="contact-check" :class="{ picked: isPicked(contact) }">
                    <Icon :name="isPicked(contact) ? 'tabler:circle-check-filled' : 'tabler:circle'" />
                </span>
            </button>
            <div v-if="search && !contacts.length" class="empty-hint mono">No one found for "{{ search }}".</div>
        </div>

        <div v-if="selected.length > 1" class="panel-group-name">
            <input v-model="groupName" type="text" placeholder="Group name (optional)" class="group-name-input" />
        </div>

        <div class="panel-foot">
            <span class="mono panel-foot-hint">search by name or email</span>
            <button type="button" class="create-btn" :disabled="!selected.length" @click="createConversation">{{ createLabel }}</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { User } from '~/types/user';

const store = useConversationStore();
const ws = useWebSocketStore();
const search = ref('');
const contacts = ref<User[]>([]);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

const selected = ref<User[]>([]);
const groupName = ref('');

const emit = defineEmits(['close']);

watch(() => search.value, (value) => {
    if (timer.value) clearTimeout(timer.value);
    timer.value = setTimeout(async () => {
        contacts.value = value ? await store.search(value) : [];
    }, 500);
});

const isPicked = (contact: User) => selected.value.some(u => u.id === contact.id);

const toggle = (contact: User) => {
    if (isPicked(contact)) selected.value = selected.value.filter(u => u.id !== contact.id);
    else selected.value = selected.value.concat([contact]);
}

const note = (contact: User) => {
    const existing = store.conversations.find(c => c.participants.length === 2 && c.participants.some(p => p.id === contact.id));
    if (existing) return 'existing conversation';
    return ws.online.has(contact.id) ? 'online' : 'offline';
}

const pickedLabel = computed(() => {
    if (!selected.value.length) return 'Pick one person, or several for a group';
    if (selected.value.length > 1) return selected.value.length + ' people selected · creates a group';
    return '1 person selected';
});

const createLabel = computed(() => selected.value.length > 1 ? 'Create group' : 'Start conversation');

const createConversation = async () => {
    if (!selected.value.length) return;

    if (selected.value.length === 1) {
        const contact = selected.value[0];
        const existing = store.conversations.find(c => c.participants.length === 2 && c.participants.some(p => p.id === contact.id));
        if (existing) {
            store.conversation = existing;
            store.mobile = true;
            close();
            return;
        }
    }

    const created = await store.create({ name: selected.value.length > 1 ? groupName.value.trim() : undefined, users: selected.value });
    if (created) {
        store.conversation = created;
        store.mobile = true;
    }
    close();
}

const close = () => {
    emit('close');
}
</script>

<style scoped>
.panel {
    width: min(440px, 100%);
    max-height: min(560px, 86vh);
    display: flex;
    flex-direction: column;
    border: 1px solid oklch(0.32 0.03 291);
    border-radius: 16px;
    background: var(--surface);
    overflow: hidden;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    color: var(--text);
}

.panel-head {
    flex: none;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border-soft);
}

.panel-head-text {
    display: grid;
    gap: 3px;
}

.panel-title {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.panel-subtitle {
    font-size: 11px;
    color: var(--text-dimmer);
}

.mono {
    font-family: 'IBM Plex Mono', monospace;
}

.icon-btn {
    margin-left: auto;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 17px;
}

.icon-btn:hover {
    border-color: var(--accent);
    color: white;
}

.panel-search {
    flex: none;
    padding: 14px 20px 10px;
}

.search-field {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border-soft);
    background: var(--bg-alt);
    border-radius: 10px;
    padding: 0 12px;
}

.search-icon {
    color: var(--text-dimmer);
    flex: none;
    font-size: 16px;
}

.search-input {
    font-family: inherit;
    font-size: 14px;
    flex: 1;
    min-width: 0;
    color: var(--text);
    background: transparent;
    border: none;
    outline: none;
    padding: 11px 0;
}

.search-input::placeholder {
    color: oklch(0.52 0.012 285);
}

.panel-list {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.panel-group-name {
    flex: none;
    padding: 0 20px 12px;
}

.group-name-input {
    font-family: inherit;
    font-size: 13.5px;
    width: 100%;
    box-sizing: border-box;
    color: var(--text);
    background: var(--bg-alt);
    border: 1px solid var(--border-soft);
    border-radius: 10px;
    padding: 10px 12px;
    outline: none;
}

.group-name-input:focus {
    border-color: var(--accent);
}

.group-name-input::placeholder {
    color: oklch(0.52 0.012 285);
}

.empty-hint {
    font-size: 11.5px;
    color: var(--text-dimmer);
    padding: 10px 2px;
}

.contact-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    font-family: inherit;
    padding: 10px 12px;
    border-radius: 11px;
    cursor: pointer;
    color: inherit;
    border: 1px solid var(--border-soft);
    background: var(--surface);
}

.contact-row.picked {
    border-color: var(--accent-soft-strong-border);
    background: var(--accent-soft);
}

.contact-avatar {
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: 99px;
    background: oklch(0.26 0.03 291);
    border: 1px solid oklch(0.34 0.03 291);
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    color: oklch(0.88 0.03 292);
}

.contact-body {
    display: grid;
    gap: 2px;
    min-width: 0;
}

.contact-name {
    font-size: 14.5px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.contact-note {
    font-size: 10.5px;
    color: var(--text-dimmer);
}

.contact-check {
    margin-left: auto;
    flex: none;
    display: grid;
    place-items: center;
    color: oklch(0.45 0.02 290);
    font-size: 19px;
}

.contact-check.picked {
    color: var(--accent);
}

.panel-foot {
    flex: none;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px 18px;
    border-top: 1px solid var(--border-soft);
}

.panel-foot-hint {
    font-size: 10.5px;
    color: var(--text-dimmer);
}

.create-btn {
    margin-left: auto;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    padding: 11px 18px;
    cursor: pointer;
}

.create-btn:disabled {
    cursor: default;
    opacity: 0.5;
}

.create-btn:hover:not(:disabled) {
    background: var(--accent-hover);
}
</style>

<template>
    <aside class="sidebar">
        <div class="sidebar-top">
            <NuxtLink to="/" class="brand">
                <div class="logo">t</div>
                <span class="brand-name">Tooms</span>
            </NuxtLink>
            <button type="button" title="New conversation" aria-label="New conversation" class="icon-btn" @click="searching = true">
                <Icon name="tabler:message-plus" />
            </button>
        </div>

        <div class="sidebar-search">
            <input v-model="query" type="text" placeholder="Search conversations" class="search-input" />
        </div>

        <div class="sidebar-list">
            <template v-for="c in filtered" :key="c.id">
                <Conversation :conversation="c" />
            </template>
            <div v-if="!store.conversations.length" class="empty-hint mono">No conversations yet — start one above.</div>
        </div>

        <div class="sidebar-footer">
            <div v-if="auth.user" class="footer-avatar">{{ store.initials(auth.user) }}</div>
            <div class="footer-identity">
                <span class="footer-name">{{ auth.user ? auth.user.name + ' ' + auth.user.lastname : '' }}</span>
                <span v-if="isDemoAccount" class="footer-tag mono">demo account</span>
            </div>
            <a href="#" class="footer-logout mono" @click.prevent="logout">log out</a>
        </div>

        <div v-if="searching" class="modal-backdrop">
            <CreateConversation @close="searching = false" />
        </div>
    </aside>
</template>

<script setup lang="ts">
import CreateConversation from './modals/CreateConversation.vue';

const auth = useAuthStore();
const store = useConversationStore();
const searching = ref(false);
const query = ref('');

const DEMO_EMAILS = ['ana.demo@tooms.app', 'ben.demo@tooms.app'];
const isDemoAccount = computed(() => !!auth.user && DEMO_EMAILS.includes(auth.user.email));

// Open the most recently active conversation by default instead of leaving the
// main pane blank - matches how any chat app (Slack, Messenger, ...) behaves.
const selectMostRecent = () => {
    if (store.conversation) return;
    if (!store.conversations.length) return;
    const sorted = [...store.conversations].sort((a, b) => {
        const at = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const bt = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return bt - at;
    });
    store.conversation = sorted[0];
}

watch(() => auth.user, async (user) => {
    if (!user) return;
    if (store.conversations.length) return;
    await store.get();
    selectMostRecent();
});

onMounted(async () => {
    if (!auth.user) return;
    if (store.conversations.length) return;
    await store.get();
    selectMostRecent();
});

const otherName = (conversation: (typeof store.conversations)[number]) => {
    if (!auth.user) return conversation.name || '';
    const id = auth.user.id;
    return conversation.participants.filter(p => p.id !== id).map(p => p.name + ' ' + p.lastname).join(', ');
}

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return store.conversations;
    return store.conversations.filter(c => {
        const name = (c.name || otherName(c)).toLowerCase();
        const preview = c.lastMessage?.content?.toLowerCase() || '';
        return name.includes(q) || preview.includes(q);
    });
});

const logout = () => {
    auth.logout();
}
</script>

<style scoped>
.sidebar {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-alt);
}

.sidebar-top {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: auto;
    color: var(--text);
}

.logo {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: var(--accent);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 15px;
    color: white;
}

.brand-name {
    font-weight: 600;
    font-size: 17px;
    letter-spacing: -0.01em;
}

.icon-btn {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
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

.sidebar-search {
    padding: 12px 16px 10px;
}

.search-input {
    font-family: inherit;
    font-size: 13.5px;
    width: 100%;
    box-sizing: border-box;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: 10px;
    padding: 10px 12px;
    outline: none;
}

.search-input:focus {
    border-color: var(--accent);
}

.search-input::placeholder {
    color: oklch(0.52 0.012 285);
}

.sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.empty-hint {
    padding: 14px 10px;
    font-size: 11.5px;
    color: var(--text-dimmer);
    line-height: 1.6;
}

.mono {
    font-family: 'IBM Plex Mono', monospace;
}

.sidebar-footer {
    border-top: 1px solid var(--border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 11px;
}

.footer-avatar {
    width: 30px;
    height: 30px;
    border-radius: 99px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    display: grid;
    place-items: center;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--accent-text);
    flex: none;
}

.footer-identity {
    display: grid;
    min-width: 0;
}

.footer-name {
    font-size: 13.5px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.footer-tag {
    font-size: 10.5px;
    color: var(--text-dimmer);
}

.footer-logout {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-dimmer);
}

.footer-logout:hover {
    color: oklch(0.92 0.008 285);
}

.modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: oklch(0.12 0.01 285 / 0.66);
    backdrop-filter: blur(3px);
    display: grid;
    place-items: center;
    padding: 24px;
}
</style>

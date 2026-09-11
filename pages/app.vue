<template>
    <div v-if="store.conversation" class="chat relative" @touchstart="touchstart" @touchend="touchend">
        <header class="chat-header">
            <div class="mobile-back" @click="store.mobile = false">
                <Icon name="tabler:chevron-left" />
            </div>
            <span class="header-avatar">{{ initials }}</span>
            <span class="header-identity">
                <span class="header-name">{{ title }}</span>
                <span class="header-status mono">{{ status }}</span>
            </span>
            <div class="header-actions">
                <button type="button" title="Audio call" aria-label="Audio call" class="pill" :class="{ active: inCall && !isVideoCall }" @click="startAudio">
                    <Icon name="tabler:phone" />
                </button>
                <button type="button" title="Video call" aria-label="Video call" class="pill" :class="{ active: inCall && isVideoCall }" @click="startVideo">
                    <Icon name="tabler:video" />
                </button>
                <button type="button" title="Conversation details" aria-label="Conversation details" class="pill" :class="{ active: detailsOpen }" @click="detailsOpen = !detailsOpen">
                    <Icon name="tabler:info-circle" />
                </button>
            </div>
        </header>

        <div v-if="inCall" class="call-banner">
            <div class="call-banner-top">
                <span class="call-dot"></span>
                <span class="mono call-label">{{ callLabel }}</span>
                <span class="mono call-timer">{{ callTimer }}</span>
            </div>

            <div class="call-tiles">
                <div v-for="remote in remoteStreams" :key="remote.stream.id" class="tile">
                    <video v-if="remote.signal?.video" :srcObject="remote.stream" autoplay playsinline class="tile-video"></video>
                    <div v-else class="tile-empty mono">
                        <div class="tile-empty-title">[ audio only ]</div>
                        <div>{{ remote.signal?.user ? remote.signal.user.name : title }}</div>
                    </div>
                </div>
                <div class="tile">
                    <video v-if="selfStream && rtc.video" :srcObject="selfStream.stream" autoplay playsinline muted class="tile-video"></video>
                    <div v-else class="tile-empty mono">
                        <div class="tile-empty-title">[ camera off ]</div>
                        <div>you</div>
                    </div>
                </div>
            </div>

            <div class="call-controls">
                <button type="button" :title="micLabel" :aria-label="micLabel" class="pill" :class="{ active: rtc.audio }" @click="toggleMic">
                    <Icon :name="rtc.audio ? 'tabler:microphone' : 'tabler:microphone-off'" />
                </button>
                <button type="button" :title="camLabel" :aria-label="camLabel" class="pill" :class="{ active: rtc.video }" @click="toggleCam">
                    <Icon :name="rtc.video ? 'tabler:video' : 'tabler:video-off'" />
                </button>
                <button type="button" title="End call" aria-label="End call" class="pill pill-end" @click="endCall">
                    <Icon name="tabler:phone-off" />
                </button>
                <span class="mono call-p2p">peer-to-peer · WebRTC</span>
            </div>
        </div>

        <div class="chat-body">
            <div class="chat-main">
                <div ref="scrollRef" class="messages" @scroll="scrolling">
                    <template v-for="row in rows" :key="row.key">
                        <div v-if="row.kind === 'divider'" class="row-divider">
                            <span class="mono">{{ row.text }}</span>
                        </div>
                        <div v-else class="row-bubble" :class="{ mine: isMine(row.message) }">
                            <div class="bubble" :class="{ mine: isMine(row.message) }">
                                <div class="bubble-text">{{ row.message.content }}</div>
                                <div class="bubble-meta mono">{{ formatTime(row.message.created_at) }}</div>
                            </div>
                        </div>
                    </template>

                    <div v-if="!rows.length" class="empty-thread">
                        <Icon name="tabler:message-2" class="empty-icon" />
                        <span class="empty-title">No messages yet.</span>
                        <span class="empty-sub mono">Send the first message, or place a call to test the connection.</span>
                    </div>
                </div>

                <div class="composer-wrap">
                    <form class="composer" @submit.prevent="send">
                        <button type="button" title="Attach a file (not available yet)" aria-label="Attach a file" class="attach-btn" disabled>
                            <Icon name="tabler:paperclip" />
                        </button>
                        <textarea ref="draftRef" v-model="draft" rows="1" :placeholder="'Message ' + firstName" class="composer-input" @keydown="onKeyDown" @input="resizeComposer"></textarea>
                        <button type="submit" title="Send message" aria-label="Send message" class="send-btn" :class="{ ready: draft.trim() }">
                            <Icon name="tabler:send" />
                        </button>
                    </form>
                    <div class="composer-hint">
                        <span class="mono">enter to send · shift+enter for a new line</span>
                        <span class="mono composer-status">socket: {{ ws.status }}</span>
                    </div>
                </div>
            </div>

            <aside v-if="detailsOpen" class="details">
                <div class="details-head">
                    <span class="details-avatar">{{ initials }}</span>
                    <span class="details-name">{{ title }}</span>
                    <span class="mono details-handle">{{ status }}</span>
                </div>
                <div class="details-list">
                    <div class="details-eyebrow mono">Details</div>
                    <div v-for="d in details" :key="d.k" class="details-row">
                        <span class="mono details-k">{{ d.k }}</span>
                        <span class="details-v">{{ d.v }}</span>
                    </div>
                </div>
                <button type="button" class="close-panel mono" @click="detailsOpen = false">close panel</button>
            </aside>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message';
import type { RTCStream } from '~/types/WebRTC/RTCStream';
import dayjs from 'dayjs';

const auth = useAuthStore();
const store = useConversationStore();
const ws = useWebSocketStore();
const rtc = useWebRTCStore();

const scrollRef = ref<HTMLElement | null>(null);
const draftRef = ref<HTMLTextAreaElement | null>(null);
const scroll = ref<number>(0);
const touchX = ref<number>(0);
const draft = ref<string>('');
const detailsOpen = ref(false);
const seconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

watch(() => store.conversation, (conversation) => {
    if (!conversation) return;
    if (!conversation.messages.length) {
        store.messages(conversation.page);
    }
});

watch(() => store.conversation?.messages, async (list) => {
    if (!list) return;
    if (!scrollRef.value) return;
    await nextTick();
    const el = scrollRef.value;
    if (el.scrollTop + el.clientHeight >= scroll.value - 40) {
        el.scrollTop = el.scrollHeight;
    }
    scroll.value = el.scrollHeight;
}, { deep: true });

watch(() => rtc.stream, (stream) => {
    if (!stream) return;
});

const other = computed(() => {
    if (!auth.user || !store.conversation) return null;
    const id = auth.user.id;
    const notMe = store.conversation.participants.filter((p) => p.id !== id);
    return notMe[0] ?? null;
});

const isGroup = computed(() => (store.conversation?.participants.length ?? 0) > 2);

const title = computed(() => {
    if (!store.conversation) return '';
    if (store.conversation.name) return store.conversation.name;
    if (!auth.user) return '';
    const id = auth.user.id;
    const notMe = store.conversation.participants.filter((p) => p.id !== id);
    let name = '';
    for (const [index, participant] of notMe.entries()) {
        name += participant.name + ' ' + participant.lastname;
        if (index < notMe.length - 1) name += ', ';
        if (index === 2) { name += '...'; break; }
    }
    return name;
});

const firstName = computed(() => (title.value || '').split(/[\s,]+/)[0] || 'them');

const initials = computed(() => {
    if (isGroup.value) return 'G' + (store.conversation?.participants.length ?? 0);
    if (!other.value) return '';
    return store.initials(other.value);
});

// There's no presence/online tracking yet (TODO) - fall back to something real instead of faking status.
const status = computed(() => {
    if (isGroup.value) return (store.conversation?.participants.length ?? 0) + ' participants';
    return other.value?.email ?? '';
});

const details = computed(() => {
    const rows: { k: string; v: string }[] = [{ k: 'type', v: isGroup.value ? 'group' : 'direct' }];
    if (isGroup.value) rows.push({ k: 'participants', v: String(store.conversation?.participants.length ?? 0) });
    return rows;
});

const isMine = (message?: Message) => !!message && !!auth.user && message.user.id === auth.user.id;

const formatTime = (iso: string) => dayjs(iso).format('HH:mm');

const dividerLabel = (iso: string) => {
    const d = dayjs(iso);
    const now = dayjs();
    if (d.isSame(now, 'day')) return 'Today';
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
    if (d.isSame(now, 'week')) return d.format('dddd');
    return d.format('D MMMM YYYY');
};

const rows = computed(() => {
    const messages = store.conversation?.messages ?? [];
    const out: { key: string; kind: 'divider' | 'bubble'; text?: string; message?: Message }[] = [];
    let lastDay: string | null = null;
    for (const m of messages) {
        const day = dayjs(m.created_at).format('YYYY-MM-DD');
        if (day !== lastDay) {
            out.push({ key: 'divider-' + day, kind: 'divider', text: dividerLabel(m.created_at) });
            lastDay = day;
        }
        out.push({ key: 'msg-' + m.id, kind: 'bubble', message: m });
    }
    return out;
});

//#region Call
const inCall = computed(() => rtc.streams.length > 0);
const isVideoCall = computed(() => rtc.video);
const remoteStreams = computed<RTCStream[]>(() => rtc.streams.filter(s => !auth.user || s.signal?.user?.id !== auth.user.id));
const selfStream = computed<RTCStream | undefined>(() => rtc.streams.find(s => auth.user && s.signal?.user?.id === auth.user.id));

const callLabel = computed(() => (isVideoCall.value ? 'Video call' : 'Audio call') + ' with ' + firstName.value);
const callTimer = computed(() => {
    const mm = Math.floor(seconds.value / 60).toString().padStart(2, '0');
    const ss = (seconds.value % 60).toString().padStart(2, '0');
    return mm + ':' + ss;
});
const micLabel = computed(() => rtc.audio ? 'Mute microphone' : 'Unmute microphone');
const camLabel = computed(() => rtc.video ? 'Turn camera off' : 'Turn camera on');

watch(inCall, (value) => {
    if (timer) clearInterval(timer);
    seconds.value = 0;
    if (value) timer = setInterval(() => seconds.value++, 1000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});

const startAudio = () => rtc.init({ audio: true, video: false });
const startVideo = () => rtc.init({ audio: true, video: true });
const endCall = () => rtc.hangout();

const toggleMic = () => {
    if (!rtc.stream) return;
    rtc.audio = !rtc.audio;
    rtc.stream.getAudioTracks().forEach((track) => track.enabled = rtc.audio);
}

const toggleCam = () => {
    if (!rtc.stream) return;
    rtc.video = !rtc.video;
}
//#endregion Call

//#region Composer
const resizeComposer = () => {
    const el = draftRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
}

const send = () => {
    const content = draft.value.trim();
    if (!content) return;
    if (!store.conversation) return;
    if (!auth.user) return;

    const msg: Message = {
        id: 0,
        user: auth.user,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation: store.conversation,
    };
    store.addMessage(msg);
    store.updatePreview(msg);
    ws.send(content);

    draft.value = '';
    nextTick(resizeComposer);
}
//#endregion Composer

const scrolling = async () => {
    const el = scrollRef.value;
    if (!el) return;
    if (!store.conversation) return;

    if (el.scrollTop <= 0) {
        const count = store.conversation.messages.length;
        const prevHeight = el.scrollHeight;
        store.conversation.page++;
        await store.messages(store.conversation.page).then(() => {
            if (count === store.conversation?.messages.length) store.conversation.page--;
        });
        await nextTick();
        el.scrollTop = el.scrollHeight - prevHeight;
    }
}

const touchstart = (e: TouchEvent) => {
    touchX.value = e.touches[0].clientX;
}

const touchend = (e: TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchX.value;
    if (diff > 100) store.mobile = false;
}
</script>

<style scoped>
.chat {
    min-height: 100vh;
    max-height: 100vh;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', system-ui, sans-serif;
}

.mono {
    font-family: 'IBM Plex Mono', monospace;
}

.chat-header {
    border-bottom: 1px solid var(--border);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
}

.mobile-back {
    display: none;
    cursor: pointer;
    font-size: 22px;
    color: var(--text-dim);
}

@media (max-width: 767px) {
    .mobile-back {
        display: flex;
    }
}

.header-avatar {
    width: 36px;
    height: 36px;
    border-radius: 99px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    display: grid;
    place-items: center;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent-text);
    flex: none;
}

.header-identity {
    display: grid;
    gap: 2px;
    min-width: 0;
}

.header-name {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.header-status {
    font-size: 11px;
    color: var(--text-dimmer);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
    flex: none;
}

.pill {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    border-radius: 10px;
    cursor: pointer;
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-dim);
    font-size: 18px;
}

.pill:hover {
    border-color: var(--accent);
    color: white;
}

.pill.active {
    border-color: var(--accent-soft-strong-border);
    background: var(--accent-soft-strong);
    color: var(--accent-text);
}

.pill-end {
    border-color: oklch(0.45 0.14 25);
    background: oklch(0.30 0.10 25);
    color: oklch(0.94 0.04 25);
}

.pill-end:hover {
    background: oklch(0.36 0.13 25);
    color: oklch(0.94 0.04 25);
    border-color: oklch(0.45 0.14 25);
}

.call-banner {
    flex: 0 0 auto;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
    background: oklch(0.145 0.012 285);
    padding: 14px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.call-banner-top {
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
}

.call-dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: oklch(0.72 0.16 150);
}

.call-label {
    font-size: 11.5px;
    color: oklch(0.80 0.012 285);
}

.call-timer {
    font-size: 11.5px;
    color: var(--text-dimmer);
}

.call-tiles {
    flex: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    overflow: hidden;
}

.tile {
    height: clamp(96px, 19vh, 196px);
    border-radius: 12px;
    border: 1px solid var(--border-strong);
    display: grid;
    place-items: center;
    background-image: repeating-linear-gradient(135deg, oklch(0.235 0.02 290) 0 10px, oklch(0.215 0.016 289) 10px 20px);
    overflow: hidden;
}

.tile-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tile-empty {
    text-align: center;
    font-size: 11.5px;
    color: oklch(0.68 0.012 285);
    line-height: 1.7;
}

.tile-empty-title {
    color: var(--accent-text);
}

.call-controls {
    flex: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.call-p2p {
    margin-left: auto;
    font-size: 10.5px;
    color: oklch(0.56 0.012 285);
}

.chat-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    overflow: hidden;
}

.chat-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.messages {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 24px 20px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.row-divider {
    display: flex;
    justify-content: center;
    padding: 14px 0 10px;
}

.row-divider span {
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dimmer);
}

.row-bubble {
    display: flex;
    justify-content: flex-start;
    padding: 3px 0;
}

.row-bubble.mine {
    justify-content: flex-end;
}

.bubble {
    max-width: min(560px, 78%);
    padding: 11px 14px 8px;
    border-radius: 14px;
    border: 1px solid var(--border-soft);
    background: var(--surface);
    color: oklch(0.95 0.006 285);
    border-bottom-left-radius: 5px;
}

.bubble.mine {
    border-color: transparent;
    background: var(--accent);
    color: white;
    border-bottom-left-radius: 14px;
    border-bottom-right-radius: 5px;
}

.bubble-text {
    font-size: 14.5px;
    line-height: 1.55;
}

.bubble-meta {
    font-size: 10px;
    margin-top: 5px;
    text-align: right;
    color: oklch(0.58 0.012 285);
}

.bubble.mine .bubble-meta {
    color: oklch(1 0 0 / 0.72);
}

.empty-thread {
    flex: 1;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 10px;
    padding: 32px 0;
    text-align: center;
}

.empty-icon {
    font-size: 26px;
    color: var(--accent-soft-strong-border);
}

.empty-title {
    font-size: 15px;
    color: oklch(0.86 0.008 285);
}

.empty-sub {
    font-size: 11.5px;
    line-height: 1.7;
    color: var(--text-dimmer);
    max-width: 34ch;
}

.composer-wrap {
    flex: none;
    padding: 12px 20px 18px;
}

.composer {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    border-radius: 14px;
    padding: 10px 10px 10px 14px;
}

.composer:focus-within {
    border-color: var(--accent);
}

.attach-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-dim);
    font-size: 16px;
    cursor: not-allowed;
    opacity: 0.5;
}

.composer-input {
    flex: 1;
    min-width: 0;
    resize: none;
    max-height: 120px;
    font-family: inherit;
    font-size: 14.5px;
    line-height: 1.5;
    color: var(--text);
    background: transparent;
    border: none;
    outline: none;
    padding: 7px 0;
}

.composer-input::placeholder {
    color: oklch(0.52 0.012 285);
}

.send-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    color: white;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    flex: none;
    font-size: 16px;
    opacity: 0.55;
}

.send-btn.ready {
    opacity: 1;
}

.composer-hint {
    display: flex;
    gap: 14px;
    padding: 8px 4px 0;
    font-size: 10.5px;
    color: oklch(0.54 0.012 285);
}

.composer-status {
    margin-left: auto;
}

.details {
    flex: 0 0 264px;
    border-left: 1px solid var(--border);
    background: var(--bg-alt);
    padding: 22px 20px;
    overflow-y: auto;
    display: grid;
    gap: 24px;
    align-content: start;
}

@media (max-width: 900px) {
    .details {
        display: none;
    }
}

.details-head {
    display: grid;
    justify-items: center;
    gap: 10px;
    text-align: center;
}

.details-avatar {
    width: 60px;
    height: 60px;
    border-radius: 99px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    display: grid;
    place-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--accent-text);
}

.details-name {
    font-size: 16px;
    font-weight: 600;
}

.details-handle {
    font-size: 11px;
    color: var(--text-dimmer);
}

.details-list {
    display: grid;
    gap: 10px;
}

.details-eyebrow {
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-text);
}

.details-row {
    display: flex;
    gap: 10px;
    align-items: baseline;
    border-bottom: 1px solid var(--border);
    padding-bottom: 9px;
}

.details-k {
    font-size: 11px;
    color: var(--text-dimmer);
}

.details-v {
    margin-left: auto;
    font-size: 13px;
    color: oklch(0.88 0.008 285);
    text-align: right;
}

.close-panel {
    font-size: 11px;
    padding: 9px 12px;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
}

.close-panel:hover {
    border-color: var(--accent);
    color: white;
}
</style>

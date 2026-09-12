<template>
    <div class="incoming">
        <div class="incoming-body">
            <span class="incoming-avatar">{{ initials }}</span>
            <span class="incoming-name">{{ signal.user.name }} {{ signal.user.lastname }}</span>
            <span class="incoming-sub mono">Incoming call…</span>
            <div class="incoming-toggles">
                <button type="button" title="Answer with camera on" aria-label="Answer with camera on" class="pill" :class="{ active: video }" @click="video = !video">
                    <Icon name="tabler:video" />
                </button>
                <button type="button" title="Answer with microphone on" aria-label="Answer with microphone on" class="pill" :class="{ active: audio }" @click="audio = !audio">
                    <Icon name="tabler:microphone" />
                </button>
            </div>
        </div>
        <div class="incoming-actions">
            <button type="button" class="action-btn decline" @click="refuse">
                <Icon name="tabler:phone-off" />
                <span>Decline</span>
            </button>
            <button type="button" class="action-btn accept" @click="accept">
                <Icon name="tabler:phone" />
                <span>Accept</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';

const props = defineProps<{
    signal: RTCSignal;
}>();

const rtc = useWebRTCStore();
const store = useConversationStore();

const initials = computed(() => store.initials(props.signal.user));

const video = ref<boolean>(false);
const audio = ref<boolean>(false);

const ringtone = ref<HTMLAudioElement>(new Audio('/audios/ringtone.mp3'));
ringtone.value.loop = true;
ringtone.value.volume = 0.1;
if (rtc.ringtone) ringtone.value.play();

watch(() => rtc.ringtone, (value) => {
    if (ringtone.value.paused && value) ringtone.value.play();
});

const emit = defineEmits(['close']);

const accept = () => {
    rtc.ringtone = true;
    ringtone.value.pause();
    ringtone.value.currentTime = 0;

    rtc.offer(props.signal, { audio: audio.value, video: video.value });
    rtc.call = null;
    emit('close');
};

const refuse = () => {
    ringtone.value.pause();
    ringtone.value.currentTime = 0;

    rtc.refuse(props.signal);
    emit('close');
};
</script>

<style scoped>
.incoming {
    width: 300px;
    margin: 16px auto 0;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    overflow: hidden;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    color: var(--text);
    box-shadow: 0 20px 40px oklch(0 0 0 / 0.45);
}

.mono {
    font-family: 'IBM Plex Mono', monospace;
}

.incoming-body {
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 24px 20px 20px;
}

.incoming-avatar {
    width: 56px;
    height: 56px;
    border-radius: 99px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    display: grid;
    place-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--accent-text);
}

.incoming-name {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.incoming-sub {
    font-size: 11px;
    color: var(--text-dimmer);
}

.incoming-toggles {
    display: flex;
    gap: 10px;
    margin-top: 8px;
}

.pill {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
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

.incoming-actions {
    display: flex;
    border-top: 1px solid var(--border);
}

.action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text-dim);
}

.action-btn:first-child {
    border-right: 1px solid var(--border);
}

.action-btn.decline {
    color: oklch(0.72 0.17 25);
}

.action-btn.decline:hover {
    background: oklch(0.24 0.05 25);
}

.action-btn.accept {
    color: oklch(0.72 0.16 150);
}

.action-btn.accept:hover {
    background: oklch(0.20 0.05 150);
}
</style>

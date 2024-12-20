<template>
    <div v-if="store.conversation" class="relative min-h-screen max-h-screen h-screen flex flex-col">
        <div class="flex items-center justify-between border-b border-neutral-800 p-4">
            <div class="flex items-center space-x-4">
                <div v-if="user" class="flex items-center justify-center w-10 h-10 bg-violet-800/50 rounded-full text-violet-300"> {{ store.initials(user) }} </div>
                <p> {{ store.conversation.name || name() }} </p>
            </div>
            <div class="space-x-6">
                <Icon @click="visiocall" name="solar:camera-outline" class="text-3xl hover:text-violet-600 cursor-pointer" />
                <Icon @click="audiocall" name="line-md:phone" class="text-3xl hover:text-violet-600 cursor-pointer" />
            </div>
        </div>
        <div v-if="rtc.stream" class="absolute w-full bg-neutral-900">
            <div class="flex space-x-4 p-4" ref="videos">
                <video v-if="focus?.signal?.video" :srcObject="focus.stream" class="w-1/2 rounded-xl overflow-hidden object-cover" autoplay playsinline ></video>
                <div v-else class="flex items-center justify-center w-1/2 bg-neutral-800 rounded-xl">
                    <div v-if="focus?.signal?.user" class="flex items-center justify-center w-16 h-16 bg-violet-800/50 rounded-full text-xl text-violet-300"> {{ store.initials(focus?.signal.user) }} </div>
                </div>
                <div class="flex space-x-4" :class="{'w-1/2': focus, 'w-full': !focus}">
                    <template v-for="stream of rtc.streams.filter(s => s.stream.id != focus?.stream.id)" :key="stream.stream.id">
                        <video v-if="stream.signal?.video" :id="stream.stream.id" :srcObject="stream.stream" class="w-full rounded-xl overflow-hidden object-cover" autoplay playsinline >
                        </video>
                        <div v-else class="flex items-center justify-center w-full bg-neutral-800 rounded-xl">
                            <div v-if="stream.signal?.user" class="flex items-center justify-center w-16 h-16 bg-violet-800/50 rounded-full text-xl text-violet-300"> {{ store.initials(stream.signal.user) }} </div>
                        </div>
                    </template>
                </div>
            </div>
            <div class="relative flex items-center justify-center w-full mb-4">
                <div class="flex items-center bg-neutral-800 rounded-lg space-x-4 px-6 py-2">
                    <div @click="togglevideo" class="flex items-center justify-center bg-neutral-700 rounded-full cursor-pointer text-neutral-300 hover:bg-neutral-600 hover:text-neutral-200 p-3" :class="{ 'bg-violet-800 text-violet-300 hover:bg-violet-700 hovertext-violet-200': rtc.video }">
                        <Icon name="solar:camera-outline" class="text-2xl" />
                    </div>
                    <div @click="toggleaudio" class="flex items-center justify-center bg-neutral-700 rounded-full cursor-pointer text-neutral-300 hover:bg-neutral-600 hover:text-neutral-200 p-3" :class="{ 'bg-violet-800 text-violet-300 hover:bg-violet-700 hovertext-violet-200': rtc.audio }">
                        <Icon name="solar:microphone-3-linear" class="text-2xl" />
                    </div>
                    <div @click="togglescreenshare" class="flex items-center justify-center bg-neutral-700 rounded-full cursor-pointer text-neutral-300 hover:bg-neutral-600 hover:text-neutral-200 p-3" :class="{ 'bg-violet-800 text-violet-300 hover:bg-violet-700 hovertext-violet-200': rtc.screen }">
                        <Icon name="ph:monitor-arrow-up" class="text-2xl" />
                    </div>
                    <div @click="hangout" class="flex items-center justify-center bg-red-700 rounded-full cursor-pointer text-neutral-300 hover:bg-red-600 hover:text-neutral-200 p-3">
                        <Icon name="solar:end-call-linear" class="text-2xl" />
                    </div>
                </div>
            </div>
            <div class="relative w-full h-4 flex items-center justify-center cursor-row-resize" @mousedown="resizing">
                <div class="absolute bottom-0 w-full h-px bg-neutral-700"></div>
                <div class="absolute top-1/2 -translate-y-1/3 z-10 flex items-center justify-center w-10 h-10 bg-neutral-800 rounded-full text-neutral-400">
                    <Icon name="hugeicons:vertical-resize" class="text-2xl text-neutral-400" />
                </div>
            </div>
        </div>
        <div class="flex flex-1 flex-col-reverse overflow-y-scroll custom-scrollbar" @scroll="scrolling()" ref="scrollRef">
            <div class="space-y-6 p-2" ref="messages">
                <template v-for="(msg, index) in store.conversation.messages" :key="msg.id">
                    <Message :message="msg" :prev_user="prev_user(index)" />
                </template>
            </div>
        </div>
        <div class="flex space-x-4 p-2">
            <Input @update:input="message = $event" @enter="send" :input="message" name="message" id="message" placeholder="Your message" icon="solar:chat-round-outline" />
            <Button @click="send" class="flex items-center justify-center !w-20 !p-0"><Icon name="lets-icons:send-light" class="text-3xl" /></Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types/message';
import type { RTCStream } from '~/types/WebRTC/RTCStream';

const auth = useAuthStore();
const store = useConversationStore();
const ws = useWebSocketStore();
const rtc = useWebRTCStore();

const scroll = ref<number>(0);
const scrollRef = ref<HTMLElement | null>(null);

const message = ref<string>('');
const messages = ref<HTMLElement | null>(null);

const oncall = ref<boolean>(false);
const videos = ref<HTMLDivElement | null>(null);
const focus = ref<RTCStream | null>(null);
const video = ref<HTMLVideoElement | null>(null);

watch(() => store.conversation, (conversation) => {
    if (!conversation) return;
    if (!conversation.messages.length) {
        console.log('fetching messages');
        // store.messages(conversation.page);
    }
});

// Scroll to bottom when new message is added
watch(() => store.conversation?.messages, async (message_list) => {
    if (!message_list) return;
    if (!messages.value) return;
    await nextTick();
    
    if (messages.value.scrollTop + messages.value.clientHeight >= scroll.value) {
        messages.value.scrollTo(0, messages.value.scrollHeight);
    }

    scroll.value = messages.value.scrollHeight;
}, { deep: true });


watch(() => rtc.stream, (stream) => {
    if (!stream) return;
    setupcall();
});

watch(() => rtc.streams, (streams) => {
    if (!streams.length) return;
    focus.value = streams[0];
}, { deep: true });

const visiocall = async () => {
    rtc.init({ audio: true, video: true });
}

const audiocall = async () => {
    rtc.init({ audio: true, video: false });
}

const setupcall = () => {
    if (!rtc.stream) return;
    oncall.value = true;
}

const prev_user = (index: number) => {
    if (index === 0) return null;
    if (!store.conversation) return null;
    return store.conversation.messages[index - 1].user;
}

const send = () => {
    if (!message.value) return;
    if (!store.conversation) return;
    if (!auth.user) return;
    const msg: Message = {
        id: 0,
        user: auth.user,
        content: message.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation: store.conversation
    };
    store.addMessage(msg);
    ws.send(message.value);

    message.value = '';
}

const scrolling = async () => {
    const el = scrollRef.value;
    if (!el) return;
    if (!store.conversation) return;

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    
    // Detect if scrolled to the top (flex-col-reverse inverts behavior, this is why scrollTop is negative)
    if (Math.abs(scrollTop) + clientHeight >= scrollHeight) {
        const count = store.conversation.messages.length;
        store.conversation.page++;
        await store.messages(store.conversation.page).then(() => {
            // If no new messages were added, decrement page
            if (count === store.conversation?.messages.length) store.conversation.page--;
        });

    }
}

// Resize video
const resizing = (e: MouseEvent) => {
    if (!videos.value) return;

    const startY = e.clientY;
    const startHeight = videos.value.clientHeight;

    const onMouseMove = (e: MouseEvent) => {
        if (!videos.value) return;

        const min = 200;
        const max = 650;
        const delta = e.clientY - startY;
        const height = Math.max(Math.min(max, startHeight + delta), min);
        videos.value.style.height = height + 'px';
    }

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

const toggleaudio = () => {
    if (!rtc.stream) return;

    // The order is important
    rtc.audio = !rtc.audio;
    rtc.stream.getAudioTracks().forEach((track) => track.enabled = rtc.audio);
}

const togglevideo = () => {
    if (!rtc.stream) return;
    rtc.video = !rtc.video;
}

const togglescreenshare = () => {
    if (!rtc.stream) return;
    // if (!video.value) return;

    // The order is important
    rtc.screen = !rtc.screen;
    // video.value.srcObject = rtc.screen ? rtc.stream : (rtc.video ? rtc.stream : null);
}

const hangout = () => {
    if (!rtc.stream) return;
    rtc.hangout();
}





// TODO: move this to conversation store
const user = computed(() => {
    if (!auth.user) return null;
    if (!store.conversation) return null;
    const id = auth.user.id;
    const notMe = store.conversation.participants.filter((participant) => participant.id !== id);
    return notMe[0];
});

const name = () => {
    if (!auth.user) return;
    if (!store.conversation) return null;

    const id = auth.user.id;
    const notMe = store.conversation.participants.filter((participant) => participant.id !== id);

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
</script>
<template>
    <div v-if="store.conversation" class="min-h-screen max-h-screen h-screen flex flex-col">
        <div class="flex items-center justify-between border-b border-neutral-800 p-4">
            <div class="flex items-center space-x-4">
                <div v-if="user" class="flex items-center justify-center w-10 h-10 bg-violet-800/50 rounded-full text-violet-300"> {{ store.initials(user) }} </div>
                <p> {{ store.conversation.name || name() }} </p>
            </div>
            <div class="space-x-6">
                <Icon @click="visiocall" name="solar:camera-outline" class="text-3xl hover:text-violet-600 cursor-pointer" />
                <Icon name="line-md:phone" class="text-3xl hover:text-violet-600 cursor-pointer" />
            </div>
        </div>
        <div v-if="rtc.stream">
            <video ref="video" class="" autoplay playsinline ></video>
            <video ref="remote" class="" autoplay playsinline ></video>
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

const auth = useAuthStore();
const store = useConversationStore();
const ws = useWebSocketStore();
const rtc = useWebRTCStore();

const scroll = ref<number>(0);
const scrollRef = ref<HTMLElement | null>(null);

const message = ref<string>('');
const messages = ref<HTMLElement | null>(null);

const video = ref<HTMLVideoElement | null>(null);
const remote = ref<HTMLVideoElement | null>(null);

watch(() => store.conversation, (conversation) => {
    if (!conversation) return;
    if (!conversation.messages.length) {
        store.messages(conversation.page);
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


watch(() => video.value, (el) => {
    if (!el) return;
    setupcall();
});

watch(() => rtc.remoteStreams.values(), (streams) => {
    const list = Array.from(streams);
    if (!list.length) return;
    if (!remote.value) return;

    remote.value.srcObject = list[0]
})

const visiocall = async () => {
    rtc.init();
}

const setupcall = () => {
    if (!rtc.stream) return;
    if (!video.value) return;
    // console.log(rtc.stream.getVideoTracks()[0].getSettings());
    
    video.value.srcObject = rtc.stream;
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
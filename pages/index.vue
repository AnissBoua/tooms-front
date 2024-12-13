<template>
    <div v-if="store.conversation" class="h-full flex flex-col">
        <div class="flex items-center justify-between border-b border-neutral-800 p-4">
            <div class="flex items-center space-x-4">
                <div v-if="user" class="flex items-center justify-center w-10 h-10 bg-violet-800/50 rounded-full text-violet-300"> {{ store.initials(user) }} </div>
                <p> {{ name() }} </p>
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
        <div class="flex flex-col flex-1 justify-end">
            <div class="flex flex-col flex-1 justify-end overflow-y-scroll space-y-6 p-2 custom-scrollbar" ref="messages">
                <template v-for="(msg, index) in store.conversation.messages" :key="msg.id">
                    <Message :message="msg" :prev_user="prev_user(index)" />
                </template>
            </div>
            <div class="flex space-x-4 p-2">
                <Input @update:input="message = $event" @enter="send" :input="message" name="message" id="message" placeholder="Your message" icon="solar:chat-round-outline" />
                <Button @click="send" class="flex items-center justify-center !w-20 !p-0"><Icon name="lets-icons:send-light" class="text-3xl" /></Button>
            </div>
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

const message = ref<string>('');
const messages = ref<HTMLElement | null>(null);

const video = ref<HTMLVideoElement | null>(null);
const remote = ref<HTMLVideoElement | null>(null);

watch(() => store.conversation, (conversation) => {
    if (!conversation) return;
    if (!conversation.messages.length) {
        store.messages(1);
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

// const keys = ref<Map<string, boolean>>(new Map());
// const handleKeyPress = (event: KeyboardEvent) => {
//     event.preventDefault(); // Prevent default browser behavior, e.g., search.
//     keys.value.set(event.key, event.type == 'keydown');

//     if (keys.value.get('Control') && keys.value.get('k')) {
//         if (!rtc.stream) return;
//         rtc.stream.getVideoTracks()[0].enabled = !rtc.stream.getVideoTracks()[0].enabled;
//     }
// };

// onMounted(() => {
//     document.addEventListener('keydown', handleKeyPress);
//     document.addEventListener('keyup', handleKeyPress);
// });

// onBeforeUnmount(() => {
//     document.removeEventListener('keydown', handleKeyPress);
//     document.addEventListener('keyup', handleKeyPress);
// });



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

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #3d3d3d;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #2a2a2a;
}
</style>
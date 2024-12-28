<template>
    <div class="bg-neutral-950 rounded-lg ring-1 ring-neutral-800/50 space-y-2 my-4">
        <div class="space-y-4 py-4">
            <div class="flex flex-col items-center">
                <p>{{ signal.user.name + ' ' + signal.user.lastname }}</p>
                <p class="text-xs text-neutral-400">En cours d'appel...</p>
            </div>
            <div class="flex justify-center space-x-4">
                <div @click="video = !video" class="flex items-center justify-center bg-neutral-800 rounded-full cursor-pointer text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300 p-4" :class="{ 'bg-violet-800 text-violet-300 hover:bg-violet-700 hovertext-violet-200': video }">
                    <Icon name="solar:camera-outline" class="text-2xl" />
                </div>
                <div @click="audio = !audio" class="flex items-center justify-center bg-neutral-800 rounded-full cursor-pointer text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300 p-4" :class="{ 'bg-violet-800 text-violet-300 hover:bg-violet-700 hovertext-violet-200': audio }">
                    <Icon name="solar:microphone-3-linear" class="text-2xl" />
                </div>
            </div>
        </div>
        <div class="w-full h-px bg-neutral-800"></div>
        <div class="flex space-x-6 px-8 py-4">
            <div @click="refuse()" class="w-1/2 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-md cursor-pointer space-x-2 px-10 py-1">
                <Icon name="solar:end-call-linear" class="text-3xl" />
                <p>Refuser</p>
            </div>
            <div @click="accept()" class="w-1/2 flex items-center justify-center bg-green-600 hover:bg-green-700 rounded-md cursor-pointer space-x-2 px-10 py-1">
                <Icon name="line-md:phone-call-loop" class="text-2xl" />
                <p>Accepter</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RTCSignal } from '~/types/WebRTC/RTCSignal';

const props = defineProps<{
    signal: RTCSignal;
}>();

const rtc = useWebRTCStore();

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

    console.log('Refusing call');
    rtc.refuse(props.signal);
    emit('close');
};

</script>
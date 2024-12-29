<template>
    <div v-if="mounted" class="min-h-screen relative flex flex-col">
        <div class="absolute -top-2/3 w-screen h-[80rem] bg-[radial-gradient(closest-side,theme(colors.violet.800/30%),theme(colors.transparent))]"></div>
        <div class="relative z-10 flex flex-1 flex-col items-center justify-center space-y-6">
            <div class="w-full flex flex-col md:flex-row items-start justify-center space-y-8 md:space-y-0 md:space-x-10 xl:space-x-28 px-4">
                <div class="w-full md:w-2/5 xl:w-1/5 space-y-10">
                    <div class="flex items-center space-x-2">
                        <img class="w-8 h-8" src="/images/logo.png" alt="logo">
                        <p class="text-xl">Tooms</p>
                    </div>
                    <div class="space-y-10">
                        <div class="flex flex-col space-y-1">
                            <Icon name="material-symbols-light:groups-outline-rounded" class="w-10 h-10 text-violet-800" />
                            <p>Unlimites members</p>
                            <p class="text-neutral-400">Invite and communicate with as many team members as you like.</p>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <Icon name="material-symbols:shield-spark-outline-rounded" class="w-8 h-8 text-violet-800" />
                            <p>Security</p>
                            <p class="text-neutral-400">Keep your conversations secure and private, just between you and your friends, thanks to WebRTC peer-to-peer connections.</p>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <Icon name="simple-icons:socketdotio" class="w-8 h-8 text-violet-800" />
                            <p>Real-time</p>
                            <p class="text-neutral-400">Use our chatbox to communicate or share documents with your colleagues, thanks to the power of Socket.IO.</p>
                        </div>
                    </div>
                </div>
                <div class="w-full md:w-1/2 bg-neutral-950 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-50 ring-1 ring-neutral-800/50 rounded-2xl space-y-7 px-4 sm:px-8 lg:px-14 py-4 sm:py-6 lg:py-14">
                    <div class="flex flex-col sm:flex-row space-y-7 sm:space-y-0 sm:space-x-4">
                        <Input @update:input="name = $event" :input="name" label="First name" name="name" id="name" placeholder="First name" icon="hugeicons:user" />
                        <Input @update:input="lastname = $event" :input="lastname" label="Last name" name="lastname" id="lastname" placeholder="Last name" icon="hugeicons:user" />
                    </div>
                    <Input @update:input="email = $event" :input="email" label="Email" name="email" id="email" placeholder="Email" icon="mynaui:envelope" />
                    <div class="space-y-2">
                        <label for="password">Password</label>
                        <div class="flex items-center w-full bg-neutral-900 ring-1 ring-neutral-800/70 focus:ring-violet-800 outline-none rounded overflow-hidden space-x-2 px-2">
                            <Icon name="material-symbols-light:lock-outline" class="w-5 h-5 text-neutral-500" />
                            <input v-model="password" class="flex-1 bg-neutral-900 outline-none placeholder:text-neutral-600 p-2" :type="!visible ? 'password' : 'text'" placeholder="Password" name="password" id="password" />
                            <Icon :name="!visible ? 'material-symbols-light:visibility-off-outline-rounded' : 'material-symbols-light:visibility-outline-rounded'" class="w-5 h-5 text-neutral-500" @click="toggleVisible" />
                        </div>
                        <p class="text-neutral-400">At least 8 characters</p>
                    </div>
                    <div>
                        <Button @click="register">Sign up</Button>
                    </div>
                    <div class="flex justify-center">
                        <p>Already have an account? <CLink to="/auth/login">Login</CLink></p>
                    </div>
                </div>
            </div>
            <div>
                <p class="text-neutral-500">© 2024 Tooms. All rights reserved.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
const store = useAuthStore();
const mounted = ref<boolean>(false);
const name = ref<string>('');
const lastname = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');

const visible = ref<boolean>(false);
const toggleVisible = () => visible.value = !visible.value;

onMounted(() => {
    if (store.token) navigateTo('/');
    setTimeout(() => mounted.value = true, 20);
});

watch(() => store.token, (token) => {
    if (token) navigateTo('/');
});

const register = async () => {
    const data = {
        name: name.value,
        lastname: lastname.value,
        email: email.value,
        password: password.value
    };
    store.register(data);
};
</script>
<template>
    <div v-if="mounted" class="min-h-screen relative flex flex-col">
        <div class="absolute -top-2/3 w-screen h-[80rem] bg-[radial-gradient(closest-side,theme(colors.violet.800/30%),theme(colors.transparent))]"></div>
        <div class="relative z-10 flex flex-1 flex-col items-center justify-center space-y-10">
            <p class="text-xl">Login to Tooms</p>
            <div class="w-1/3 bg-neutral-950 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-50 ring-1 ring-neutral-800/50 rounded-2xl space-y-7 px-14 py-14">
                <Input @change="email = $event" label="Username or email" name="email" id="email" placeholder="Username or email" icon="material-symbols:account-circle-full" />
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <label for="password">Password</label>
                        <CLink>Forgot password?</CLink>
                    </div>
                    <div class="flex items-center w-full bg-neutral-900 ring-1 ring-neutral-800/70 focus:ring-violet-800 outline-none rounded overflow-hidden space-x-2 px-2">
                        <Icon name="material-symbols-light:lock-outline" class="w-5 h-5 text-neutral-500" />
                        <input v-model="password" class="flex-1 bg-neutral-900 outline-none placeholder:text-neutral-600 p-2" :type="!visible ? 'password' : 'text'" placeholder="Password" name="password" id="password" />
                        <Icon :name="!visible ? 'material-symbols-light:visibility-off-outline-rounded' : 'material-symbols-light:visibility-outline-rounded'" class="w-5 h-5 text-neutral-500" @click="toggleVisible" />
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" name="remember" id="remember" />
                    <label for="remember">Remember me</label>
                </div>
                <div>
                    <Button @click="login">Log in</Button>
                </div>
                <div class="flex justify-center">
                    <p>Don't have an account? <CLink :to="'/auth/signup'">Sign Up</CLink></p>
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

const login = async () => {
    store.login(email.value, password.value);
};
</script>
import type { Login } from "~/types/http/auth/login";
import type { User } from "~/types/user";
import type { Whoami } from "~/types/http/auth/whoami";
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const ws = useWebSocketStore();
    const conversation = useConversationStore();
    const rtc = useWebRTCStore();
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

    async function init() {
        if (!token.value) token.value = await Promise.resolve(localStorage.getItem('token'));
        if (token.value && !user.value) whoami();
    }

    async function register(data: any) {
        try {
            const config = useRuntimeConfig();
            const res = await $fetch<Login>(config.public.API_URL + '/api/auth/register', {
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            localStorage.setItem('token', res.token);
            token.value = res.token;

            await whoami();
        } catch (error) {
            console.error('AUTH::STORE::REGISTER');
            console.error(error);
        }
    }

    async function login(email: string, password: string) {
        try {
            const config = useRuntimeConfig();
            const data = await $fetch<Login>(config.public.API_URL + '/api/auth/login', {
                method: 'POST',
                body: { email, password },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh', data.refresh);
            token.value = data.token;

            await whoami();
        } catch (error) {
            console.error('AUTH::STORE::LOGIN');
            console.error(error);
            await refresh();
        }
    }

    async function whoami() {
        try {
            const config = useRuntimeConfig();
            const data = await $fetch<Whoami>(config.public.API_URL + '/api/auth/whoami', {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                },
            })

            user.value = data;
        } catch (error) {
            console.error('AUTH::STORE::WHOAMI');
            console.error(error);
            await refresh();
        }
    }

    async function refresh() {
        try {
            const config = useRuntimeConfig();
            const data = await $fetch<Login>(config.public.API_URL + '/api/auth/refresh', {
                method: 'POST',
                body: { refresh: localStorage.getItem('refresh') },
                headers: {
                    Authorization: `Bearer ${token.value}`,
                },
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh', data.refresh);
            token.value = data.token;

            await whoami();
        } catch (error) {
            console.error('AUTH::STORE::REFRESH');
            console.error(error);
            logout();
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        token.value = null;
        user.value = null;
        ws.logout();
        conversation.logout();
        rtc.logout();
        navigateTo('/auth/login');
    }

    if (typeof window !== 'undefined') {
        init();
    }


    return {
        token,
        user,
        init,
        login,
        whoami,
        register,
        logout,
    }
});
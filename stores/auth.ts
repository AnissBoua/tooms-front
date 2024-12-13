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
            const res = await useInterceptorFetch<Login>('/api/auth/register', {
                method: 'POST',
                body: data,
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
            const data = await useInterceptorFetch<Login>('/api/auth/login', {
                method: 'POST',
                body: { email, password },
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh', data.refresh);
            token.value = data.token;

            await whoami();
        } catch (error) {
            console.error('AUTH::STORE::LOGIN');
            console.error(error);
        }
    }

    async function whoami() {
        try {
            const data = await useInterceptorFetch<Whoami>('/api/auth/whoami');
            user.value = data;
        } catch (error) {
            console.error('AUTH::STORE::WHOAMI');
            console.error(error);
        }
    }

    async function refresh() {
        try {
            const data = await useInterceptorFetch<Login>('/api/auth/refresh', {
                method: 'POST',
                body: { refresh: localStorage.getItem('refresh') },
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
        refresh,
        logout,
    }
});
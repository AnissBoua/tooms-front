import type { Login } from "~/types/http/auth/login";
import type { User } from "~/types/user";
import type { Whoami } from "~/types/http/auth/whoami";
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

    async function init() {
        if (!token.value) token.value = await Promise.resolve(localStorage.getItem('token'));
        console.log(token.value);
        if (token.value && !user.value) whoami();
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
            token.value = data.token;

            whoami();
        } catch (error) {
            console.error('AUTH::STORE::LOGIN');
            console.error(error);
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
        }
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
    }
});
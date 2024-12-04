import type { User } from "~/types/user";

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

    async function login(email: string, password: string) {
        try {
            const config = useRuntimeConfig();
            const response = await fetch(config.public.API_URL + '/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
    
            const data = await response.json();
            token.value = data.token;
        } catch (error) {
            console.error('AUTH::STORE::LOGIN');
            console.error(error);
        }
    }

    async function whoami() {
        console.log('WHOAMI');
        
        try {
            const config = useRuntimeConfig();
            const response = await fetch(config.public.API_URL + '/api/auth/whoami', {
                headers: {
                    Authorization: `Bearer ${token.value}`,
                },
            })

            if (!response.ok) {
                token.value = null;
                return;
            }

            const data = await response.json();
            user.value = data;
        } catch (error) {
            console.error('AUTH::STORE::WHOAMI');
            console.error(error);
        }
    }

    return {
        token,
        user,
        login,
        whoami,
    }
});
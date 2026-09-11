<template>
    <div class="auth">
        <header class="auth-header">
            <div class="auth-header-inner">
                <NuxtLink to="/" class="auth-brand">
                    <div class="auth-logo">t</div>
                    <span class="auth-brand-name">Tooms</span>
                </NuxtLink>
                <NuxtLink to="/" class="auth-back">← back to site</NuxtLink>
            </div>
        </header>

        <div class="auth-container">
            <div>
                <h1 class="auth-h1">{{ heroTitle }}</h1>
                <p class="auth-lead">{{ heroBody }}</p>

                <div class="auth-points">
                    <div v-for="point in points" :key="point" class="auth-point">
                        <span class="auth-point-dot"></span>
                        <span>{{ point }}</span>
                    </div>
                </div>

                <div v-if="isLogin" class="demo-panel">
                    <div class="demo-panel-label">Demo accounts</div>
                    <div class="demo-panel-list">
                        <button v-for="account in demoAccounts" :key="account.email" type="button" class="demo-panel-item" @click="fillDemo(account)">
                            <span class="demo-panel-avatar">{{ account.initials }}</span>
                            <span class="demo-panel-email">{{ account.email }}</span>
                            <span class="demo-panel-tag mono-meta">{{ account.label }}</span>
                        </button>
                    </div>
                    <p class="mono-note demo-panel-note">Click one to fill the form. Use the second account in a private window to talk between the two.</p>
                </div>
            </div>

            <div class="auth-card-col">
                <div class="auth-card-wrap">
                    <div class="auth-card-glow"></div>
                    <div class="auth-card">
                        <div class="auth-tabs">
                            <NuxtLink to="/auth/login" class="auth-tab" :class="{ active: isLogin }">Log in</NuxtLink>
                            <NuxtLink to="/auth/signup" class="auth-tab" :class="{ active: !isLogin }">Create account</NuxtLink>
                        </div>

                        <form class="auth-form" @submit.prevent="submit">
                            <label v-if="!isLogin" class="field">
                                <span class="field-label">Display name</span>
                                <input v-model="displayName" type="text" placeholder="Ana Mercier" autocomplete="name" class="field-input" />
                                <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
                            </label>

                            <label class="field">
                                <span class="field-label">Email</span>
                                <input v-model="email" type="email" placeholder="you@example.com" autocomplete="email" class="field-input" />
                                <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
                            </label>

                            <label class="field">
                                <span class="field-label field-label-row">
                                    Password
                                    <button type="button" class="pw-toggle" @click="showPw = !showPw">{{ showPw ? 'hide' : 'show' }}</button>
                                </span>
                                <input v-model="password" :type="showPw ? 'text' : 'password'" placeholder="••••••••" :autocomplete="isLogin ? 'current-password' : 'new-password'" class="field-input" />
                                <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
                                <div v-if="!isLogin" class="pw-strength">
                                    <div class="pw-strength-track">
                                        <div class="pw-strength-fill" :style="{ width: strengthWidth }"></div>
                                    </div>
                                    <span class="mono-meta">{{ strengthLabel }}</span>
                                </div>
                            </label>

                            <div v-if="isLogin" class="auth-row">
                                <label class="checkbox">
                                    <input v-model="remember" type="checkbox" />
                                    Keep me signed in
                                </label>
                                <a href="#" class="auth-forgot">Forgot password?</a>
                            </div>

                            <template v-else>
                                <label class="checkbox checkbox-block">
                                    <input v-model="terms" type="checkbox" />
                                    <span>I understand this is a personal portfolio project and that my data may be cleared without notice.</span>
                                </label>
                                <span v-if="errors.terms" class="field-error">{{ errors.terms }}</span>
                            </template>

                            <button type="submit" class="btn btn-primary auth-submit" :disabled="submitting">{{ submitting ? 'Working…' : (isLogin ? 'Log in' : 'Create account') }}</button>

                            <div v-if="notice" class="auth-notice" :class="{ 'auth-notice-error': noticeType === 'error' }">
                                <span class="auth-notice-dot"></span>
                                <span>{{ notice }}</span>
                            </div>
                        </form>

                        <div class="auth-switch">
                            <span>{{ isLogin ? 'No account yet?' : 'Already registered?' }}</span>
                            <NuxtLink :to="isLogin ? '/auth/signup' : '/auth/login'" class="auth-switch-action">{{ isLogin ? 'Create one →' : 'Log in instead →' }}</NuxtLink>
                        </div>
                    </div>
                </div>

                <p class="mono-note auth-footnote">Passwords are hashed server-side; sessions use JWT. Nothing here is a production security guarantee.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ mode: 'login' | 'register' }>();

const auth = useAuthStore();
const isLogin = computed(() => props.mode === 'login');

useHead({ title: (isLogin.value ? 'Log in' : 'Create account') + ' — Tooms' });

const displayName = ref('');
const email = ref('');
const password = ref('');
const remember = ref(true);
const terms = ref(false);
const showPw = ref(false);
const submitting = ref(false);
const errors = ref<Record<string, string>>({});
const notice = ref('');
const noticeType = ref<'success' | 'error'>('success');

const heroTitle = computed(() => isLogin.value ? 'Welcome back.' : 'Create your Tooms account.');
const heroBody = computed(() => isLogin.value
    ? 'Sign in to pick your conversations back up. Messages, audio and video calls are all in the same window.'
    : 'Twenty seconds and no email confirmation. You get an account, a contact list and a place to test messaging and calls.');
const points = computed(() => isLogin.value
    ? ['Your conversation history is restored on sign-in.', 'Calls need camera and microphone permission.', 'Sessions last 7 days when you stay signed in.']
    : ['Only a name, an email and a password.', 'Search for the demo accounts to test messaging and calls.', 'Built for recruiters to try — no strings attached.']);

const demoAccounts = [
    { initials: 'AM', email: 'ana.demo@tooms.app', password: 'tooms-demo-1', label: 'window 1' },
    { initials: 'BK', email: 'ben.demo@tooms.app', password: 'tooms-demo-2', label: 'window 2' },
];

const fillDemo = (account: typeof demoAccounts[number]) => {
    email.value = account.email;
    password.value = account.password;
    errors.value = {};
    notice.value = 'Demo credentials filled in.';
    noticeType.value = 'success';
};

const strength = computed(() => {
    const p = password.value;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
});
const strengthLabel = computed(() => ['too short', 'weak', 'fair', 'good', 'strong'][strength.value]);
const strengthWidth = computed(() => (strength.value / 4) * 100 + '%');

const splitName = (full: string) => {
    const parts = full.trim().split(/\s+/);
    return { name: parts[0], lastname: parts.length > 1 ? parts.slice(1).join(' ') : parts[0] };
};

const extractErrors = (error: any): { fieldErrors: Record<string, string>; message: string | null } => {
    const payload = error?.data?.error;
    if (Array.isArray(payload)) {
        const fieldErrors: Record<string, string> = {};
        for (const item of payload) {
            const field = item.field === 'lastname' ? 'name' : item.field;
            if (field && item.message) fieldErrors[field] = item.message;
        }
        return { fieldErrors, message: null };
    }
    if (typeof payload === 'string') return { fieldErrors: {}, message: payload };
    return { fieldErrors: {}, message: 'Something went wrong. Please try again.' };
};

const submit = async () => {
    const localErrors: Record<string, string> = {};
    if (!isLogin.value && displayName.value.trim().length < 2) localErrors.name = 'Enter a display name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) localErrors.email = 'Enter a valid email address.';
    if (password.value.length < 8) localErrors.password = isLogin.value ? 'Password is required.' : 'Use at least 8 characters.';
    if (!isLogin.value && !terms.value) localErrors.terms = 'Please acknowledge the note above.';

    if (Object.keys(localErrors).length) {
        errors.value = localErrors;
        notice.value = '';
        return;
    }

    errors.value = {};
    notice.value = '';
    submitting.value = true;

    try {
        if (isLogin.value) {
            await auth.login(email.value, password.value);
            notice.value = 'Signed in. Opening your conversations.';
        } else {
            const { name, lastname } = splitName(displayName.value);
            await auth.register({ name, lastname, email: email.value, password: password.value });
            notice.value = 'Account created. Signing you in and opening your first conversation.';
        }
        noticeType.value = 'success';
    } catch (error) {
        const { fieldErrors, message } = extractErrors(error);
        errors.value = fieldErrors;
        notice.value = message ?? 'Something went wrong. Please try again.';
        noticeType.value = 'error';
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    if (auth.token) navigateTo('/app');
});

watch(() => auth.token, (token) => {
    if (token) navigateTo('/app');
});
</script>

<style scoped>
.auth {
    --bg: oklch(0.17 0.012 285);
    --bg-alt: oklch(0.185 0.013 286);
    --surface: oklch(0.21 0.014 288);
    --border: oklch(0.29 0.018 290);
    --border-strong: oklch(0.32 0.02 290);
    --text: oklch(0.96 0.005 285);
    --text-dim: oklch(0.74 0.012 285);
    --text-dimmer: oklch(0.60 0.012 285);
    --accent: oklch(0.55 0.22 295);
    --accent-hover: oklch(0.60 0.22 295);
    --accent-soft: oklch(0.24 0.05 295);
    --accent-soft-border: oklch(0.36 0.09 295);
    --accent-soft-strong: oklch(0.28 0.07 295);
    --accent-soft-strong-border: oklch(0.42 0.10 295);
    --accent-text: oklch(0.85 0.08 295);
    --error: oklch(0.72 0.17 25);

    font-family: 'Space Grotesk', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
}

.mono-meta, .mono-note, .field-label, .field-error, .field-input, .auth-forgot, .pw-toggle, .checkbox, .auth-notice, .demo-panel-label, .demo-panel-email, .demo-panel-tag {
    font-family: 'IBM Plex Mono', monospace;
}

.auth-header {
    border-bottom: 1px solid oklch(0.24 0.016 289);
}

.auth-header-inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.auth-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: auto;
    color: var(--text);
}

.auth-logo {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: var(--accent);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 15px;
    color: white;
}

.auth-brand-name {
    font-weight: 600;
    font-size: 19px;
    letter-spacing: -0.01em;
}

.auth-back {
    font-size: 12.5px;
    color: var(--text-dimmer);
}

.auth-back:hover {
    color: oklch(0.92 0.008 285);
}

.auth-container {
    max-width: 1080px;
    margin: 0 auto;
    padding: 56px 24px 72px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 56px;
    align-items: start;
}

.auth-h1 {
    font-size: 40px;
    line-height: 1.08;
    letter-spacing: -0.03em;
    font-weight: 700;
    margin: 0 0 18px;
}

.auth-lead {
    font-size: 16.5px;
    line-height: 1.65;
    color: var(--text-dim);
    margin: 0 0 32px;
    max-width: 42ch;
}

.auth-points {
    display: grid;
    gap: 12px;
    max-width: 420px;
}

.auth-point {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.auth-point-dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: oklch(0.65 0.20 295);
    margin-top: 8px;
    flex: none;
}

.auth-point span:last-child {
    font-size: 14.5px;
    line-height: 1.55;
    color: oklch(0.78 0.012 285);
}

.demo-panel {
    margin-top: 34px;
    max-width: 420px;
    border: 1px dashed var(--border-strong);
    border-radius: 12px;
    padding: 18px 20px;
}

.demo-panel-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin-bottom: 14px;
}

.demo-panel-list {
    display: grid;
    gap: 8px;
}

.demo-panel-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    font-family: inherit;
}

.demo-panel-item:hover {
    border-color: var(--accent);
}

.demo-panel-avatar {
    width: 28px;
    height: 28px;
    border-radius: 99px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    display: grid;
    place-items: center;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--accent-text);
    flex: none;
}

.demo-panel-email {
    font-size: 12.5px;
    color: oklch(0.90 0.008 285);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.demo-panel-tag {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-dimmer);
    flex: none;
}

.demo-panel-note {
    margin: 14px 0 0;
    line-height: 1.65;
}

.mono-note {
    font-size: 11.5px;
    color: var(--text-dimmer);
    margin: 0;
}

.mono-meta {
    font-size: 11px;
    color: var(--text-dimmer);
}

.auth-card-col {
    display: flex;
    flex-direction: column;
}

.auth-card-wrap {
    position: relative;
}

.auth-card-glow {
    position: absolute;
    inset: -10% -6%;
    background: radial-gradient(55% 50% at 55% 35%, oklch(0.55 0.22 295 / 0.22), transparent 70%);
    filter: blur(10px);
}

.auth-card {
    position: relative;
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    background: var(--surface);
    padding: 28px 28px 30px;
    max-width: 460px;
}

.auth-tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 11px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    margin-bottom: 26px;
}

.auth-tab {
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    flex: 1;
    padding: 9px 12px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid transparent;
    color: oklch(0.70 0.012 285);
}

.auth-tab.active {
    border-color: var(--accent-soft-strong-border);
    background: var(--accent-soft-strong);
    color: oklch(0.97 0.02 295);
}

.auth-form {
    display: grid;
    gap: 18px;
}

.field {
    display: grid;
    gap: 8px;
}

.field-label {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklch(0.68 0.012 285);
}

.field-label-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.field-input {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 15px;
    color: var(--text);
    background: var(--bg-alt);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    padding: 12px 14px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
}

.field-input:focus {
    border-color: var(--accent);
}

.field-input::placeholder {
    color: oklch(0.52 0.012 285);
}

.field-error {
    font-size: 11.5px;
    color: var(--error);
}

.pw-toggle {
    margin-left: auto;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: none;
    background: transparent;
    border: none;
    color: var(--accent-text);
    cursor: pointer;
    padding: 0;
}

.pw-strength {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 2px;
}

.pw-strength-track {
    flex: 1;
    height: 4px;
    border-radius: 99px;
    background: var(--border);
    overflow: hidden;
}

.pw-strength-fill {
    height: 100%;
    border-radius: 99px;
    background: oklch(0.60 0.20 295);
}

.auth-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.checkbox {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13.5px;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    color: oklch(0.76 0.012 285);
    cursor: pointer;
}

.checkbox-block {
    align-items: flex-start;
    line-height: 1.55;
}

.checkbox input {
    width: 15px;
    height: 15px;
    accent-color: var(--accent);
    cursor: pointer;
    flex: none;
}

.checkbox-block input {
    margin-top: 2px;
}

.auth-forgot {
    margin-left: auto;
    font-size: 13.5px;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.btn-primary {
    font-family: inherit;
    font-size: 15px;
    color: white;
    background: var(--accent);
    border: none;
    border-radius: 11px;
    padding: 14px 20px;
    cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
}

.btn-primary:disabled {
    cursor: default;
    opacity: 0.65;
}

.auth-notice {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border: 1px solid var(--accent-soft-border);
    background: var(--accent-soft);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--accent-text);
}

.auth-notice-dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: oklch(0.70 0.18 295);
    margin-top: 7px;
    flex: none;
}

.auth-notice-error {
    border-color: oklch(0.45 0.14 25);
    background: oklch(0.24 0.05 25);
    color: oklch(0.85 0.10 25);
}

.auth-notice-error .auth-notice-dot {
    background: var(--error);
}

.auth-switch {
    margin-top: 24px;
    padding-top: 22px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 14px;
    color: oklch(0.70 0.012 285);
}

.auth-switch-action {
    font-size: 14px;
    font-weight: 500;
}

.auth-footnote {
    max-width: 460px;
    margin: 16px 0 0;
    line-height: 1.7;
}

a {
    text-decoration: none;
    color: var(--accent-text);
}

a:hover {
    color: oklch(0.88 0.10 295);
}

::selection {
    background: oklch(0.55 0.22 295);
    color: white;
}
</style>

<template>
    <div class="home">
        <header class="home-header">
            <div class="home-header-inner">
                <div class="home-brand">
                    <div class="home-logo">t</div>
                    <span class="home-brand-name">Tooms</span>
                </div>
                <nav class="home-nav">
                    <a href="#features">Features</a>
                    <a href="#demo">Demo access</a>
                    <a href="#stack">Stack</a>
                    <a href="#about">About</a>
                </nav>
                <div class="home-header-actions">
                    <NuxtLink to="/auth/login" class="btn btn-ghost">Log in</NuxtLink>
                    <a href="#demo" class="btn btn-primary">Try the demo</a>
                </div>
            </div>
        </header>

        <section class="home-hero">
            <div>
                <div class="badge">
                    <span class="badge-dot"></span>
                    Personal project — not a commercial product
                </div>
                <h1 class="home-h1">Chat, calls and video<br />in one place.</h1>
                <p class="home-lead">Tooms is a self-built team communication app: real-time messaging, one-to-one and group conversations, audio calls and video calls. I built it to practice full-stack architecture, WebSockets and WebRTC end to end.</p>
                <div class="home-hero-actions">
                    <a href="#demo" class="btn btn-primary">Try the demo</a>
                    <a :href="links.githubBack" target="_blank" rel="noopener" class="btn btn-secondary">Backend on GitHub</a>
                    <a :href="links.githubFront" target="_blank" rel="noopener" class="btn btn-secondary">Frontend on GitHub</a>
                </div>
                <p class="mono-note">No signup needed — two demo accounts are provided below.</p>
            </div>

            <div class="home-shot-wrap">
                <div class="home-shot-glow"></div>
                <div class="home-shot">
                    <div class="home-shot-bar">
                        <span></span><span></span><span></span>
                        <span class="home-shot-title">tooms — conversation</span>
                    </div>
                    <div class="home-shot-canvas">
                        <img src="/images/screenshot.png" alt="Tooms conversation view with an active call" class="home-shot-img" />
                    </div>
                </div>
            </div>
        </section>

        <section id="features" class="home-section home-section-alt">
            <div class="home-container">
                <h2 class="eyebrow">What it does</h2>
                <div class="feature-grid">
                    <div v-for="f in features" :key="f.title" class="feature-card">
                        <div class="feature-icon"><Icon :name="f.icon" /></div>
                        <h3>{{ f.title }}</h3>
                        <p>{{ f.body }}</p>
                        <div class="mono-meta">{{ f.meta }}</div>
                    </div>
                </div>
            </div>
        </section>

        <section id="demo" class="home-section">
            <div class="home-container demo-grid">
                <div>
                    <h2 class="eyebrow">Demo access</h2>
                    <h3 class="home-h3">Two accounts, so you can talk to yourself.</h3>
                    <p class="home-p">Messaging and calls need two people. Rather than asking you to register twice, two accounts are pre-configured and already in each other's contacts.</p>
                    <ol class="demo-steps">
                        <li>Log in as Ana in your normal window.</li>
                        <li>Log in as Ben in a private window or a second browser.</li>
                        <li>Start a conversation, then place a video call between them.</li>
                    </ol>
                    <p class="mono-note mono-note-loose">Demo accounts are seeded ahead of time. Camera and microphone permission is required for calls.</p>
                </div>

                <div class="demo-accounts">
                    <div v-for="a in demoAccounts" :key="a.id" class="demo-card">
                        <div class="demo-card-head">
                            <div class="demo-avatar">{{ a.initials }}</div>
                            <div>
                                <div class="demo-name">{{ a.name }}</div>
                                <div class="mono-meta">{{ a.role }}</div>
                            </div>
                            <NuxtLink to="/auth/login" class="btn btn-accent demo-cta">Log in as {{ a.name.split(' ')[0] }}</NuxtLink>
                        </div>
                        <div class="demo-fields">
                            <div class="demo-field">
                                <span class="demo-field-label">email</span>
                                <span class="demo-field-value">{{ a.email }}</span>
                                <button type="button" class="copy-btn" @click="copy(a.id + '-email', a.email)">{{ copied === a.id + '-email' ? 'copied' : 'copy' }}</button>
                            </div>
                            <div class="demo-field">
                                <span class="demo-field-label">password</span>
                                <span class="demo-field-value">{{ a.password }}</span>
                                <button type="button" class="copy-btn" @click="copy(a.id + '-pw', a.password)">{{ copied === a.id + '-pw' ? 'copied' : 'copy' }}</button>
                            </div>
                        </div>
                    </div>
                    <div class="demo-own">
                        <span>Prefer your own account?</span>
                        <NuxtLink to="/auth/signup">Create one in 20 seconds →</NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <section id="stack" class="home-section home-section-alt">
            <div class="home-container stack-grid">
                <div>
                    <h2 class="eyebrow">Under the hood</h2>
                    <h3 class="home-h3 home-h3-tight">Built end to end, front to database.</h3>
                    <p class="home-p">Relational schema around users, conversations and messages, with many-to-many contacts and participants. Real-time transport over WebSockets, peer-to-peer media over WebRTC.</p>
                </div>
                <div>
                    <div class="stack-tags">
                        <span v-for="s in stack" :key="s" class="stack-tag">{{ s }}</span>
                    </div>
                </div>
            </div>
        </section>

        <section id="about" class="home-section">
            <div class="home-container">
                <h2 class="eyebrow">About the project</h2>
                <p class="about-lead">I'm a developer, and Tooms is my own side project — no team, no company behind it. The first version was all about getting the functionality right: authentication, persistent conversations, live message delivery and peer-to-peer calls.</p>
                <p class="home-p about-p">It's here so recruiters can look at working code and a running app rather than a list of technologies on a CV. Everything is open source, and I'm happy to walk through any part of it.</p>
                <div class="about-actions">
                    <a :href="links.githubBack" target="_blank" rel="noopener" class="btn btn-secondary">Read the backend code</a>
                    <a :href="links.githubFront" target="_blank" rel="noopener" class="btn btn-secondary">Read the frontend code</a>
                    <a :href="links.portfolio" target="_blank" rel="noopener" class="btn btn-secondary">Get in touch</a>
                </div>
            </div>
        </section>

        <footer class="home-footer">
            <div class="home-container home-footer-inner">
                <div class="home-brand">
                    <div class="home-logo home-logo-sm">t</div>
                    <span class="mono-meta">Tooms — personal project, {{ year }}</span>
                </div>
                <div class="home-footer-links">
                    <a :href="links.githubBack" target="_blank" rel="noopener">Backend repo</a>
                    <a :href="links.githubFront" target="_blank" rel="noopener">Frontend repo</a>
                    <a v-if="links.linkedin" :href="links.linkedin" target="_blank" rel="noopener">LinkedIn</a>
                    <a :href="'mailto:' + links.email">{{ links.email }}</a>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
useHead({
    title: 'Tooms — chat, calls and video in one place',
    meta: [
        { name: 'description', content: 'Tooms is a self-built team communication app: real-time messaging, calls and video, built end to end as a personal project.' },
    ],
});

const auth = useAuthStore();

const links = {
    githubBack: 'https://github.com/AnissBoua/tooms-back',
    githubFront: 'https://github.com/AnissBoua/tooms-front',
    portfolio: 'https://anisse-bouainbi.fr/',
    linkedin: 'https://www.linkedin.com/in/anisse-bouainbi/',
    email: 'anissbouainbi@hotmail.it',
};

const features = [
    { title: 'Messaging', icon: 'tabler:message-circle-2', body: "One-to-one and group conversations with persisted history, delivered live over WebSockets.", meta: 'Conversation · Message · participants' },
    { title: 'Audio calls', icon: 'tabler:phone', body: 'Direct peer-to-peer audio between contacts, with signalling handled by the same socket connection.', meta: 'WebRTC · STUN' },
    { title: 'Video calls', icon: 'tabler:video', body: 'Camera streams negotiated between participants, with mute and camera toggles during the call.', meta: 'getUserMedia · RTCPeerConnection' },
];

const stack = ['TypeScript', 'Vue 3 / Nuxt', 'Node.js / Express', 'TypeORM / MySQL', 'Socket.IO', 'WebRTC', 'Pinia', 'JWT auth'];

const demoAccounts = [
    { id: 'ana', initials: 'AM', name: 'Ana Mercier', role: 'demo account · window 1', email: 'ana.demo@tooms.app', password: 'tooms-demo-1' },
    { id: 'ben', initials: 'BK', name: 'Ben Kowalski', role: 'demo account · window 2 (private)', email: 'ben.demo@tooms.app', password: 'tooms-demo-2' },
];

const copied = ref<string | null>(null);
let copiedTimeout: ReturnType<typeof setTimeout> | null = null;

const copy = async (key: string, value: string) => {
    try {
        await navigator.clipboard.writeText(value);
    } catch (error) {
        console.error(error);
        return;
    }
    copied.value = key;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => copied.value = null, 1600);
};

const year = new Date().getFullYear();

onMounted(() => {
    // Already signed in (e.g. returning demo user) - skip straight to the app
    if (auth.token) navigateTo('/app');
});
</script>

<style scoped>
.home {
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

    font-family: 'Space Grotesk', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
}

.mono-meta, .mono-note, .demo-field-label, .demo-field-value, .home-shot-title, .stack-tag, .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
}

.home-header {
    position: sticky;
    top: 0;
    z-index: 20;
    backdrop-filter: blur(12px);
    background: oklch(0.17 0.012 285 / 0.82);
    border-bottom: 1px solid var(--border);
}

.home-header-inner, .home-container {
    max-width: 1140px;
    margin: 0 auto;
    padding: 0 24px;
}

.home-header-inner {
    padding-top: 14px;
    padding-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 28px;
}

.home-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: auto;
}

.home-logo {
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

.home-logo-sm {
    width: 22px;
    height: 22px;
    border-radius: 7px;
    font-size: 13px;
}

.home-brand-name {
    font-weight: 600;
    font-size: 19px;
    letter-spacing: -0.01em;
}

.home-nav {
    display: flex;
    gap: 24px;
    font-size: 14px;
}

.home-nav a, .home-footer-links a {
    color: var(--text-dim);
}

.home-nav a:hover, .home-footer-links a:hover {
    color: var(--text);
}

.home-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
}

.btn-ghost {
    font-size: 14px;
    padding: 8px 14px;
    border-radius: 9px;
    border: 1px solid var(--border-strong);
    color: oklch(0.88 0.008 285);
}

.btn-ghost:hover {
    border-color: var(--accent);
    color: white;
}

.btn-primary {
    font-size: 14px;
    padding: 9px 15px;
    border-radius: 9px;
    background: var(--accent);
    color: white;
    font-weight: 500;
}

.btn-primary:hover {
    background: var(--accent-hover);
}

.btn-secondary {
    padding: 12px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-strong);
    color: oklch(0.92 0.008 285);
    font-size: 14.5px;
}

.btn-secondary:hover {
    border-color: var(--accent);
}

.btn-accent {
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 9px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    color: oklch(0.92 0.05 295);
    font-weight: 500;
}

.btn-accent:hover {
    background: oklch(0.34 0.09 295);
}

.home-hero {
    max-width: 1140px;
    margin: 0 auto;
    padding: 84px 24px 72px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 56px;
    align-items: center;
}

.badge {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 6px 12px 6px 9px;
    border-radius: 99px;
    border: 1px solid var(--accent-soft-border);
    background: var(--accent-soft);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--accent-text);
    margin-bottom: 26px;
}

.badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: oklch(0.65 0.20 295);
}

.home-h1 {
    font-size: 58px;
    line-height: 1.04;
    letter-spacing: -0.035em;
    font-weight: 700;
    margin: 0 0 22px;
}

.home-lead {
    font-size: 18px;
    line-height: 1.6;
    color: var(--text-dim);
    margin: 0 0 34px;
    max-width: 46ch;
}

.home-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 30px;
}

.home-hero-actions .btn-primary {
    padding: 14px 24px;
    border-radius: 11px;
    font-size: 15px;
    font-weight: 600;
}

.home-hero-actions .btn-secondary {
    padding: 14px 22px;
    border-radius: 11px;
    font-size: 15px;
    font-weight: 500;
}

.mono-note {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    color: var(--text-dimmer);
    margin: 0;
}

.mono-note-loose {
    margin-top: 24px;
    line-height: 1.7;
}

.home-shot-wrap {
    position: relative;
}

.home-shot-glow {
    position: absolute;
    inset: -12% -6% -6%;
    background: radial-gradient(60% 55% at 60% 40%, oklch(0.55 0.22 295 / 0.28), transparent 70%);
    filter: blur(10px);
}

.home-shot {
    position: relative;
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    overflow: hidden;
    background: var(--surface);
}

.home-shot-bar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
}

.home-shot-bar span:not(.home-shot-title) {
    width: 10px;
    height: 10px;
    border-radius: 99px;
    background: oklch(0.40 0.02 290);
}

.home-shot-title {
    margin-left: 8px;
    font-size: 11.5px;
    color: var(--text-dimmer);
}

.home-shot-canvas {
    aspect-ratio: 16 / 9;
    display: grid;
    place-items: center;
    overflow: hidden;
}

.home-shot-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
}

.home-section {
    padding-top: 76px;
    padding-bottom: 76px;
}

.home-section-alt {
    border-top: 1px solid oklch(0.24 0.016 289);
    background: var(--bg-alt);
}

.eyebrow {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 34px;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
}

.feature-card {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 26px 24px 28px;
    background: var(--surface);
}

.feature-card:hover {
    border-color: oklch(0.45 0.10 295);
}

.feature-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--accent-soft);
    border: 1px solid var(--accent-soft-border);
    margin-bottom: 18px;
    display: grid;
    place-items: center;
    font-size: 18px;
    color: var(--accent-text);
}

.feature-card h3 {
    font-size: 19px;
    font-weight: 600;
    margin: 0 0 10px;
    letter-spacing: -0.01em;
}

.feature-card p {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-dim);
    margin: 0 0 16px;
}

.mono-meta {
    font-size: 11.5px;
    color: var(--text-dimmer);
}

.demo-grid, .stack-grid {
    display: grid;
    gap: 48px;
    align-items: start;
}

.demo-grid {
    grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
}

.eyebrow {
    display: block;
}

.home-h3 {
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -0.025em;
    font-weight: 700;
    margin: 0 0 16px;
}

.home-h3-tight {
    font-size: 30px;
    line-height: 1.2;
}

.home-p {
    font-size: 16px;
    line-height: 1.65;
    color: var(--text-dim);
    margin: 0 0 24px;
}

.demo-steps {
    margin: 0;
    padding-left: 20px;
    font-size: 15px;
    line-height: 1.9;
    color: oklch(0.78 0.012 285);
}

.demo-accounts {
    display: grid;
    gap: 16px;
}

.demo-card {
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    background: var(--surface);
    padding: 22px 24px;
}

.demo-card-head {
    display: flex;
    align-items: center;
    gap: 13px;
    margin-bottom: 18px;
    flex-wrap: wrap;
}

.demo-avatar {
    width: 40px;
    height: 40px;
    border-radius: 99px;
    background: var(--accent-soft-strong);
    border: 1px solid var(--accent-soft-strong-border);
    display: grid;
    place-items: center;
    font-weight: 600;
    font-size: 15px;
    color: var(--accent-text);
    flex-shrink: 0;
}

.demo-name {
    font-weight: 600;
    font-size: 16px;
}

.demo-cta {
    margin-left: auto;
}

.demo-fields {
    display: grid;
    gap: 8px;
}

.demo-field {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 10px 10px 13px;
}

.demo-field-label {
    font-size: 11px;
    color: var(--text-dimmer);
    width: 62px;
    flex-shrink: 0;
}

.demo-field-value {
    font-size: 13px;
    color: oklch(0.92 0.008 285);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.copy-btn {
    margin-left: auto;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    padding: 6px 11px;
    border-radius: 7px;
    border: 1px solid var(--border-strong);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    flex-shrink: 0;
}

.copy-btn:hover {
    border-color: var(--accent);
    color: white;
}

.demo-own {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border: 1px dashed var(--border-strong);
    border-radius: 12px;
    font-size: 14px;
    color: var(--text-dim);
}

.demo-own a {
    color: var(--accent-text);
    font-weight: 500;
}

.demo-own a:hover {
    color: oklch(0.88 0.10 295);
}

.stack-grid {
    grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
}

.stack-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
}

.stack-tag {
    font-size: 12.5px;
    padding: 8px 13px;
    border-radius: 8px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: oklch(0.86 0.01 285);
}

.about-lead {
    font-size: 19px;
    line-height: 1.6;
    color: oklch(0.90 0.008 285);
    margin: 0 0 16px;
    max-width: 62ch;
}

.about-p {
    max-width: 62ch;
}

.about-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.home-footer {
    border-top: 1px solid oklch(0.24 0.016 289);
    background: var(--bg-alt);
}

.home-footer-inner {
    padding: 44px 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
}

.home-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 22px;
    font-size: 14px;
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

@media (max-width: 720px) {
    .home-nav {
        display: none;
    }

    .home-h1 {
        font-size: 40px;
    }
}
</style>

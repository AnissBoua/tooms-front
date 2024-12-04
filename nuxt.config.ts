// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/fonts', '@nuxt/icon', '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      API_URL: process.env.API_URL || 'http://localhost:7000'
    }
  }
})
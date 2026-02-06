// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  build: {
    transpile: ['@vuepic/vue-datepicker'],
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],

  css: ['~/assets/css/main.css'],

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/cadastro', '/esqueci-senha', '/reset-senha'],
      saveRedirectToCookie: true,
    },
    types: './shared/types/database.types.ts',
  },

  routeRules: {
    '/login': { ssr: false },
    '/cadastro': { ssr: false },
    '/esqueci-senha': { ssr: false },
    '/confirm': { ssr: false },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Fenci - Gestão Financeira Pessoal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Organize suas finanças com um app que funciona de verdade' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
      ],
      script: [
        {
          innerHTML: `(function(){var k='fenci-theme';var s=document.documentElement;var v=localStorage.getItem(k);var d=v==='dark'||(!v&&window.matchMedia('(prefers-color-scheme: dark)').matches);s.classList.toggle('dark',d);})();`,
          tagPriority: 1,
        },
      ],
    },
  },
})
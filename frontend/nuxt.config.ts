export default defineNuxtConfig({
  compatibilityDate: '2026-10-23',
  devtools: { enabled: false },
  css: [
    '~/assets/css/main.css',
    '~/assets/css/landing.css',
    '~/assets/css/music.css',
    '~/assets/css/theory.css',
    '~/assets/css/progress.css',
    '~/assets/css/fields.css',
    '~/assets/css/profile.css',
  ],
  typescript: { strict: true },
  runtimeConfig: {
    apiBase: 'http://127.0.0.1:8020',
    public: { heroVariant: 'blue-full-hands-javascript' },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      titleTemplate: '%s · JSlab',
      meta: [{ name: 'theme-color', content: '#10120e' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=jslab' },
      ],
    },
  },
  routeRules: {
    '/dashboard': { ssr: false },
    '/profile': { ssr: false },
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },
})

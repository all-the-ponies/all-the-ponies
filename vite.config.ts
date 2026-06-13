import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import vike from 'vike/plugin'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'


// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueJsx(),
    // vueDevTools({
    //   launchEditor: 'codium'
    // }),
    
    cloudflare({
      viteEnvironment: {name: 'ssr'},
    }),
    vike(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/assets\.all-the-ponies\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-data-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'All The Ponies',
        short_name: 'ATP',
        description: 'Get accurate info about MLP: Magic Princess and track your collection',
        theme_color: '#FF6B9B',
        background_color: '#e1f2fa',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 5000,
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().valueOf()),
    __BASE_URL__: JSON.stringify("https://all-the-ponies.com/"),
  }
})

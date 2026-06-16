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
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: (options) => [
              '/game-assets/game_version.json',
              '/game-assets/game_objects.json',
              '/game-assets/group_quests.json',
              '/game-assets/fortune_shop.json',
            ].includes(options.url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'game-data-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: (options) => options.url.pathname.startsWith('/game-assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets-cache',
              expiration: {
                maxEntries: 600,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        id: "https://all-the-ponies.com/",
        start_url: "/",
        display: "standalone",
        name: "All The Ponies",
        scope: "/",
        short_name: "All The Ponies",
        theme_color: "#ff6b9b",
        background_color: "rgba(225, 242, 250, 1)",
        description: "Get accurate info about MLP: Magic Princess and track your collection",
        shortcuts: [
          {
            name: "Ponies",
            url: "/search/ponies",
            description: "Search all the ponies in the game"
          },
          {
            name: "Inventory",
            url: "/inventory",
            description: "View your inventory"
          },
          {
            name: "Who's That Pony?",
            url: "/guesser",
            description: "Guess the pony from the silhouette"
          }
        ],
        categories: [
          "entertainment",
          "games",
          "reference"
        ],
        icons: [
          {
            src: "/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/maskable-icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/maskable-icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
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

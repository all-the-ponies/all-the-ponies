import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import vike from 'vike/plugin'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devAssetsUrl = process.env.DEV_ASSETS_URL ?? env.DEV_ASSETS_URL ?? ''

  return {
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,ttf}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: devAssetsUrl ? [] : [
          {
            urlPattern: (options) => options.url.origin === 'https://assets.all-the-ponies.com' && [
              '/manifest.json',
              '/game_version.json',
              '/game_objects.json',
              '/group_quests.json',
              '/fortune_shop.json',
              '/tasks_data.json',
              '/collection_data.json',
              '/maze_data.json',
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
            urlPattern: (options) => options.url.origin === 'https://assets.all-the-ponies.com',
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
        display: "minimal-ui",
        name: "All The Ponies",
        scope: "/",
        short_name: "Ponies",
        theme_color: "#ff6b9b",
        background_color: "#e1f2faff",
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
    __DEV_ASSETS_URL__: JSON.stringify(devAssetsUrl),
  },
  }
})

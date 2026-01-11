import { createSSRApp } from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './globals'

export function createApp() {
    const app = createSSRApp(App)

    // Plugins

    const pinia = createPinia()
    if (!import.meta.env.SSR) {
        pinia.use(piniaPluginPersistedstate)
    }

    const head = createHead({
        init: [
            {
                title: i18n.global.t('ALL_THE_PONIES'),
                titleTemplate: `%s - ${i18n.global.t('ALL_THE_PONIES')}`,
            }
        ]
    })

    const router = createRouter()

    app.use(i18n)
    app.use(router)
    app.use(head)
    app.use(pinia)

    return { app, router, head }
}

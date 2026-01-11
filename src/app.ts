import { createApp as createVueApp, h } from 'vue'
import App from './App.vue'
import router from './router'
import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './globals'

export function createApp() {
    const app = createVueApp(App)

    // Plugins

    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)

    const head = createHead({
        init: [
            {
                title: i18n.global.t('ALL_THE_PONIES'),
                titleTemplate: `%s - ${i18n.global.t('ALL_THE_PONIES')}`,
            }
        ]
    })

    app.use(i18n)
    app.use(router)
    app.use(head)
    app.use(pinia)

    return app
}

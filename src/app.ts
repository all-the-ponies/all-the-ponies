import { createSSRApp } from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from './globals'
import { TemplateParamsPlugin } from '@unhead/vue/plugins'

export function createApp(domain) {
    const app = createSSRApp(App)

    // Plugins

    const pinia = createPinia()
    if (!import.meta.env.SSR) {
        pinia.use(piniaPluginPersistedstate)
    }

    const head = createHead({
        plugins: [
            TemplateParamsPlugin,
        ],
        init: [
            {
                templateParams: {
                    separator: '-',
                    site: {
                        url: `https://${domain}`,
                        name: i18n.global.t('site.title'),
                        description: i18n.global.t('site.description'),
                    },
                },
                title: i18n.global.t('site.title'),
                titleTemplate: `%s %separator ${i18n.global.t('site.title')}`,
                meta: [
                    {
                        property: 'og:site:name',
                        content: () => `%site.name`,
                    },
                    {
                        property: 'og:description',
                        content: '%site.description',
                    },
                    {
                        property: 'og:image',
                        content: '%site.url/favicon/favicon.png',
                    }
                ]
            },
        ],
    })

    const router = createRouter()

    app.use(i18n)
    app.use(router)
    app.use(head)
    app.use(pinia)

    return { app, router, head }
}

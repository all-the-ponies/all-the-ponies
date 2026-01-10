import './assets/css/main.css'

import { computed, createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupI18n, loadLocaleMessages, LOCALES } from './i18n'
import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export const i18n = setupI18n()

export async function setLanguage(language: string) {
    await loadLocaleMessages(i18n, language)
}

export const language = computed(() => {
    return {
        code: i18n.global.locale.value,
        key: LOCALES[i18n.global.locale.value].key,
    }
})

setLanguage('en')

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

app.mount('#app')

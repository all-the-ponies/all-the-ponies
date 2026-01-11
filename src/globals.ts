import { loadLocaleMessages, LOCALES, setupI18n } from "./i18n";
import { computed } from "vue";


export const i18n = setupI18n()

export async function setLanguage(language: string) {
    await loadLocaleMessages(i18n.global, language)
}

export const language = computed(() => {
    return {
        code: i18n.global.locale.value,
        key: LOCALES[i18n.global.locale.value].key,
    }
})

import { nextTick } from 'vue'
import {
  createI18n,
  type I18n,
  type I18nOptions,
} from 'vue-i18n'

import en_locale from './locales/en.json'
import type { Language } from './types/gameDataTypes'
import { language } from './globals'
import { isClient } from '@vueuse/core'

export const LOCALES: Record<string, {
  name: string,
  key: Language,
}> = {
    en: {
      name: "English",
      key: "english",
    },
    ar: {
      name: "العربية",
      key: "arabic",
    },
    "zh-CH": {
      name: "简体中文",
      key: "chinese",
    },
    fr: {
      name: "Français",
      key: "french",
    },
    de: {
      name: "Deutsch",
      key: "german",
    },
    it: {
      name: "Italiano",
      key: "italian",
    },
    ja: {
      name: "日本語",
      key: "japanese",
    },
    ko: {
      name: "한국어",
      key: "korean",
    },
    "pt-BR": {
      name: "Português-BR",
      key: "brazilian portuguese",
    },
    ru: {
      name: "Русский",
      key: "russian",
    },
    es: {
      name: "Español",
      key: "spanish",
    },
    th: {
      name: "ภาษาไทย",
      key: "thai",
    },
    tr: {
      name: "Türkçe",
      key: "turkish",
    }
}

const loadedLanguages = ['en']


export function setupI18n(options: Omit<I18nOptions, 'legacy'> = { locale: 'en' }) {
  const i18nOptions = {
    legacy: false as false,
    globalInjection: true,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: en_locale,
    },
    ...options,
  }

  const i18n = createI18n(i18nOptions)

  // loadLocaleMessages(i18n.global, i18nOptions.locale)
  
  return i18n
}

export function setI18nLanguage(i18n: I18n['global'], locale: string) {
    (i18n.locale as Record<'value', string>).value = locale
    if (isClient) {
      document.documentElement.setAttribute('lang', locale)
    }
}

export async function loadLocaleMessages(i18n: I18n['global'], locale: string) {
  if (!(locale in loadedLanguages)) {
    // load locale messages with dynamic import
    const messages = await import(
      `./locales/${locale}.json`
    )
  
    // set locale and locale message
    i18n.setLocaleMessage(locale, cleanLocaleMessages(messages.default))

    loadedLanguages.push(locale)
  }
  
  setI18nLanguage(i18n, locale)

  return nextTick()
}

function cleanLocaleMessages(messages: object) {
  const cleanedMessages = {}
  
  for (let [key, value] of Object.entries(messages)) {
    if (value instanceof Object && value.constructor === Object) {
      cleanedMessages[key] = cleanLocaleMessages(messages[key])
    } else {
      if (value) {
        cleanedMessages[key] = value
      }
    }
  }
  
  return cleanedMessages
}


// export const i18n = setupI18n()

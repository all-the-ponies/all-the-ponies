<script lang="ts" setup>
import { setLanguage } from '@/globals'
import { LOCALES } from '@/i18n'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'
import type { PageContext } from 'vike/types'
import { shallowRef, watch, type ShallowReactive } from 'vue'

const pageContext = usePageContext() as ShallowReactive<PageContext & {locale: string}>

const selectedLanguage = shallowRef<string>(pageContext.locale)

watch(
    selectedLanguage,
    () => {
        setLanguage(selectedLanguage.value)
        // return
        window.history.replaceState(null, '', modifyUrl(pageContext.urlOriginal, {
            pathname: `/${selectedLanguage.value}${pageContext.urlParsed.pathname}`,
        }))
    }
)
</script>

<template>
    <select
        name="language"
        id="language"
        v-model="selectedLanguage"
        aria-label="Language"
    >
    <!-- @change="(event) => {setLanguage((event.target as HTMLSelectElement).value)}" -->
        <option
            v-for=" [ code, lang ]  in Object.entries(LOCALES)"
            :value="code"
        >
            {{ new Intl.DisplayNames([code], { type: "language" }).of(code) }}
        </option>
    </select>
</template>

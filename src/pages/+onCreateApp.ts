// Environment: server & client

 
import { i18n, setLanguage } from '@/globals'
import { LOCALES } from '@/i18n'
import { chooseDefaultLocale } from '@/scripts/chooseDefaultLocale'
import { loadGameData } from '@/scripts/gameData'
import acceptLanguage from 'accept-language'
import type { PageContext } from 'vike/types'
import { extractLocale } from './extractLocale'
// import { inject as injectAnalytics } from "@vercel/analytics"
 
export async function onCreateApp(pageContext: PageContext & {locale: string}) {
    await loadGameData()
    
    if (pageContext.isRenderingHead) {
        // Don't add plugins when rendering <head> — see https://vike.dev/onCreateApp#lifecycle
        return
    }
    const app = pageContext.app

    // Workaround for vue-i18n SSR bug on Vercel/Node
    if (!( '__VUE_PROD_DEVTOOLS__' in globalThis)) {
        (globalThis as any).__VUE_PROD_DEVTOOLS__ = false
    }

    if (!pageContext.locale) {
        let { locale } = extractLocale(pageContext.urlParsed)

        if (locale === null) {
            if (pageContext.isClientSide) {
                locale = chooseDefaultLocale()
            } else {
                acceptLanguage.languages(Object.keys(LOCALES))
                locale = acceptLanguage.get(new Headers(pageContext.headers).get('Accept-Language'))
            }
        }

        pageContext.locale = locale
    }

    await setLanguage(pageContext.locale)

    app.use(i18n)


    // injectAnalytics()
}

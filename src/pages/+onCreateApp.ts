// Environment: server & client

 
import { i18n, setLanguage } from '@/globals'
import type { PageContext } from 'vike/types'
import { inject as injectAnalytics } from "@vercel/analytics"
 
export async function onCreateApp(pageContext: PageContext & {locale: string}) {
    if (pageContext.isRenderingHead) {
        // Don't add plugins when rendering <head> — see https://vike.dev/onCreateApp#lifecycle
        return
    }
    const app = pageContext.app

    // Workaround for vue-i18n SSR bug on Vercel/Node
    if (!( '__VUE_PROD_DEVTOOLS__' in globalThis)) {
        (globalThis as any).__VUE_PROD_DEVTOOLS__ = false
    }

    await setLanguage(pageContext.locale)

    app.use(i18n)

    injectAnalytics()
}

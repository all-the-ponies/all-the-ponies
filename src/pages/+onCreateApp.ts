// Environment: server & client

 
import { i18n, setLanguage } from '@/globals'
import type { PageContext } from 'vike/types'
 
export async function onCreateApp(pageContext: PageContext & {locale: string}) {
    if (pageContext.isRenderingHead) {
        // Don't add plugins when rendering <head> — see https://vike.dev/onCreateApp#lifecycle
        return
    }
    const app = pageContext.app

    await setLanguage(pageContext.locale)

    app.use(i18n)
}

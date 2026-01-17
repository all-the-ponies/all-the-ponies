import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import type { PageContext } from 'vike/types'

export async function onCreatePinia(pageContext: PageContext) {
    pageContext.pinia.use(piniaPluginPersistedstate)
}

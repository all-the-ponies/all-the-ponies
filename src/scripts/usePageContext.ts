import type { PageContext } from 'vike/types'
import { computed, inject, shallowRef, type App, type InjectionKey, type Ref } from 'vue'
 
const key = Symbol() as InjectionKey<Ref<PageContext>>
 
export function usePageContext() {
  const pageContext = inject(key)
  return pageContext
}
 
export function setPageContext(app: App, pageContext: Ref<PageContext>) {
  app.provide(key, pageContext)
}

import { chooseDefaultLocale } from '@/scripts/chooseDefaultLocale'
import { redirect } from 'vike/abort'
import { modifyUrl } from 'vike/modifyUrl'
import type { PageContextClient } from 'vike/types'
import { extractLocale } from './extractLocale'
 
export function onBeforeRoute(pageContext: PageContextClient) {
  let { urlWithoutLocale, pathnameWithoutLocale, locale } = extractLocale(pageContext.urlParsed)
  if (locale === null) {
    locale = chooseDefaultLocale() || locale
    throw redirect(modifyUrl(
      pageContext.urlOriginal,
      {
        pathname: `/${locale}${pathnameWithoutLocale}`
      }
    ))
  }
  if (locale === 'zh-CH') {
    throw redirect(`/zh${pathnameWithoutLocale}`, 301)
  }
  return {
    pageContext: {
      locale,
      urlLogical: urlWithoutLocale,
    }
  }
}

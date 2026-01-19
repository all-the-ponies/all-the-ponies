import { LOCALES } from '@/i18n'
import { redirect } from 'vike/abort'
import { modifyUrl } from 'vike/modifyUrl'
import type { PageContextServer } from 'vike/types'
import acceptLanguage from 'accept-language'
import { extractLocale } from './extractLocale'
 
export function onBeforeRoute(pageContext: PageContextServer) {
  let { urlWithoutLocale, pathnameWithoutLocale, locale } = extractLocale(pageContext.urlParsed)
  // console.log('route language', locale, pageContext.urlOriginal, urlWithoutLocale)
  if (locale === null) {
    acceptLanguage.languages(Object.keys(LOCALES))
    locale = acceptLanguage.get(new Headers(pageContext.headers).get('Accept-Language'))
    throw redirect(modifyUrl(
      pageContext.urlOriginal,
      {
        pathname: `/${locale}${pathnameWithoutLocale}`
      }
    ))
  }
  return {
    pageContext: {
      locale,
      urlLogical: urlWithoutLocale,
    }
  }
}

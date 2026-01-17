import { setLanguage } from '@/globals'
import { LOCALES } from '@/i18n'
import { modifyUrl } from 'vike/modifyUrl'
import type { PageContext } from 'vike/types'
 
export function onBeforeRoute(pageContext: PageContext) {
  const { urlWithoutLocale, locale } = extractLocale(pageContext.urlParsed)
  // console.log('route language', locale, pageContext.urlOriginal, urlWithoutLocale)
  if (!pageContext.isPrerendering) {
    //   setLanguage(locale)
  }
  return {
    pageContext: {
      // Make locale available as pageContext.locale
      locale,
      // Vike's router will use pageContext.urlLogical instead of pageContext.urlOriginal and
      // the locale is removed from pageContext.urlParsed
      urlLogical: urlWithoutLocale,
    }
  }
}
 
function extractLocale(url: PageContext['urlParsed']) {
  const { pathname } = url

  const urlParts = pathname.split('/')
 
  // Determine the locale, for example:
  //  /en-US/film/42 => en-US
  //  /de-DE/film/42 => de-DE
  let locale = urlParts[1]
  let pathnameWithoutLocale = pathname

  if (locale && locale in LOCALES) {
    pathnameWithoutLocale = '/' + urlParts.slice(2).join('/')
  } else {
    locale = 'en'
  }
 
  // Reconstruct full URL
  const urlWithoutLocale = modifyUrl(url.href, { pathname: pathnameWithoutLocale })
 
  return { locale, urlWithoutLocale }
}

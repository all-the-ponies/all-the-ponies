import { LOCALES } from "@/i18n"
import { modifyUrl } from "vike/modifyUrl"
import type { PageContext } from "vike/types"

export function extractLocale(url: PageContext['urlParsed']) {
  const { pathname } = url

  const urlParts = pathname.split('/')
 
  let locale = urlParts[1]
  let pathnameWithoutLocale = pathname

  if (locale && locale in LOCALES) {
    pathnameWithoutLocale = '/' + urlParts.slice(2).join('/')
  } else {
    locale = null
  }
 
  // Reconstruct full URL
  const urlWithoutLocale = modifyUrl(url.href, { pathname: pathnameWithoutLocale })
 
  return { locale, urlWithoutLocale, pathnameWithoutLocale }
}

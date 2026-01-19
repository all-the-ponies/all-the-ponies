import { LOCALES } from '@/i18n'
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
  return {
    pageContext: {
      locale,
      urlLogical: urlWithoutLocale,
    }
  }
}

function chooseDefaultLocale() {
    let locale

    for (let code of navigator.languages) {
        if (code in LOCALES) {
            locale = code
            break
        } else if (code.split('-')[0] in LOCALES) {
            locale = code.split('-')[0]
            break
        }
    }

    return locale
}

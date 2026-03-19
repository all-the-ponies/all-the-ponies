import { language } from "@/globals"
import { LOCALES } from "@/i18n"

export function fixUrl(url: string) {

  if (url.includes('://')) {
    return url
  }

  let pathParts = url.split('/')
  if (pathParts[0] in LOCALES || pathParts[1] in LOCALES) {
    return url
  }
  return `/${language.value.code}${url}`
}

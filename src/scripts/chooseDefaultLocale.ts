import { LOCALES } from "@/i18n"

export function chooseDefaultLocale() {
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

import { language } from "@/globals";
import type { PageContext } from "vike/types";

export function lang(pageContext: PageContext) {
    return language.value.code
}

import type { PageContext } from "vike/types";
import type { Data } from "./+data";
import { createAssetUrl } from "@/scripts/assets";
import { language } from "@/globals";

export function data(pageContext: PageContext<Data>) {
    return createAssetUrl(pageContext.data.collection.image[language.value.key], {direct: true})
}

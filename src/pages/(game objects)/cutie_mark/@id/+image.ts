import { createAssetUrl } from "@/scripts/assets";
import { makeOg } from "@/scripts/makeOg";
import type { PageContext } from "vike/types";
import type { Data } from "./+data";

export function image(pageContext: PageContext<Data>) {
    return makeOg(createAssetUrl(pageContext.data.cutie_mark.image.main.path))
}

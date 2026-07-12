import { getCollection } from "@/scripts/gameData";
import type { CollectionType } from "@/types/gameDataTypes";
import { render } from "vike/abort";
import type { PageContext } from "vike/types";

export interface Data {
    collection: CollectionType,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const collection = getCollection(id)
    
    if (!collection) {
        throw render(404, `Collection with id ${id}`)
    }

    return { collection }
}

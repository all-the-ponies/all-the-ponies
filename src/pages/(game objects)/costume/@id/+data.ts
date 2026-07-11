import { getObject } from "@/scripts/gameData"
import type { CostumePartType, CostumeType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    costume: CostumeType,
    parts: Record<'body' | 'mane' | 'tail', CostumePartType | null>,
    subsets: CostumeType[],
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const costume = getObject(id, 'costume')
    const parts: Record<'body' | 'mane' | 'tail', CostumePartType | null> = {
        body: null,
        mane: null,
        tail: null,
    }
    const subsets: CostumeType[] = []

    if (costume === null) {
        throw render(404, `Avatar with id ${id} doesn't exist`)
    }

    parts.body = getObject(costume.parts.body, 'costume_part')
    parts.mane = getObject(costume.parts.mane, 'costume_part')
    parts.tail = getObject(costume.parts.tail, 'costume_part')

    subsets.push(...costume.subsets.map(subset => getObject(subset, 'costume')))

    return {
        costume,
        parts,
        subsets,
    }
}

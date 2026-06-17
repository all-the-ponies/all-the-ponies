import { getObject } from "@/scripts/gameData"
import type { CostumePartType, CostumeType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    costume: CostumeType,
    parts: Record<'body' | 'mane' | 'tail', CostumePartType | null>,
    subsets: CostumeType[],
}

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const costume = await getObject(id, 'costume')
    const parts: Record<'body' | 'mane' | 'tail', CostumePartType | null> = {
        body: null,
        mane: null,
        tail: null,
    }
    const subsets: CostumeType[] = []

    if (costume === null) {
        throw render(404, `Avatar with id ${id} doesn't exist`)
    }

    const fetchParts = () => {
        return Promise.all([
            getObject(costume.parts.body, 'costume_part').then(part => parts.body = part),
            getObject(costume.parts.mane, 'costume_part').then(part => parts.mane = part),
            getObject(costume.parts.tail, 'costume_part').then(part => parts.tail = part),
        ])
    }

    const fetchSubsets = () => {
        return Promise.all(
            costume.subsets.map(subset => getObject(subset, 'costume'))
        ).then(costumes => subsets.push(...costumes))
    }

    await Promise.all([
        fetchParts(),
        fetchSubsets(),
    ])

    return {
        costume,
        parts,
        subsets,
    } satisfies Data
}

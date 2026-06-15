import { getObject } from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const house = await getObject(id, 'house')

    if (house === null) {
        throw render(404, `House with id ${id} doesn't exist`)
    }

    return { house }
}

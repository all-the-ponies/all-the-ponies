import gameData from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const pony = gameData.getObject(id, 'pony')

    if (pony === null) {
        throw render(404, `Pony with id ${id} doesn't exist`)
    }

    return { pony }
}

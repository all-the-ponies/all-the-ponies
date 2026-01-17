import gameData from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const decor = gameData.getObject(id, 'decor')

    if (decor === null) {
        throw render(404, `Decor with id ${id} doesn't exist`)
    }

    return { decor }
}

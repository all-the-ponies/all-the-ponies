import gameData from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const avatar = gameData.getObject(id, 'avatar')

    if (avatar === null) {
        throw render(404, `Avatar with id ${id} doesn't exist`)
    }

    return { avatar }
}

import gameData from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const shop = gameData.getObject(id, 'shop')

    if (shop === null) {
        throw render(404, `Shop with id ${id} doesn't exist`)
    }

    return { shop }
}

import api from "@/scripts/api"
import gameData from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    console.log('getting price history')
    let priceHistory = await api.getPriceHistory(id)
    if ('detail' in priceHistory) {
        priceHistory = null
    }
    
    const pony = gameData.getObject(id, 'pony')

    if (pony === null) {
        throw render(404, `Pony with id ${id} doesn't exist`)
    }

    return { pony, priceHistory }
}

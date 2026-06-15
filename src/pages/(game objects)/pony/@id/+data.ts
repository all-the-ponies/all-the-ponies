import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject, ready } from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams

    // await ready
    
    console.log('Getting object')
    const pony = await getObject(id, 'pony')
    console.log('Got object')

    if (pony === null) {
        throw render(404, `Pony with id ${id} doesn't exist`)
    }
    
    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { pony, priceHistory }
}

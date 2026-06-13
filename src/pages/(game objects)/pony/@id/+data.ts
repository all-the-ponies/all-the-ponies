import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const pony = getObject(id, 'pony')

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

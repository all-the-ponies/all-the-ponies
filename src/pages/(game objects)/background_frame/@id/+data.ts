import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const background_frame = getObject(id, 'background_frame')

    if (background_frame === null) {
        throw render(404, `Avatar frame with id ${id} doesn't exist`)
    }

    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { background_frame, priceHistory }
}

import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import gameData from "@/scripts/gameData"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams

    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }
    
    const avatar = gameData.getObject(id, 'avatar')

    if (avatar === null) {
        throw render(404, `Avatar with id ${id} doesn't exist`)
    }

    return { avatar, priceHistory }
}

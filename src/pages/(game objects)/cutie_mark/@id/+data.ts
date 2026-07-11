import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import type { CutieMarkType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    cutie_mark: CutieMarkType,
    priceHistory: PriceHistoryType | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const cutie_mark = getObject(id, 'cutie_mark')

    if (cutie_mark === null) {
        throw render(404, `Avatar frame with id ${id} doesn't exist`)
    }

    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { cutie_mark, priceHistory }
}

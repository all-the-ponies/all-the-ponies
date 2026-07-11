import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import type { DecorType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    decor: DecorType,
    priceHistory: PriceHistoryType | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams

    const decor = getObject(id, 'decor')

    if (decor === null) {
        throw render(404, `Decor with id ${id} doesn't exist`)
    }

    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { decor, priceHistory }
}

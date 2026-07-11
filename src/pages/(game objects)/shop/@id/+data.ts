import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import type { ShopType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    shop: ShopType,
    priceHistory: PriceHistoryType | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const shop = getObject(id, 'shop')

    if (shop === null) {
        throw render(404, `Shop with id ${id} doesn't exist`)
    }
    
    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { shop, priceHistory }
}

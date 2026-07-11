import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import type { AvatarType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    avatar: AvatarType,
    priceHistory: PriceHistoryType | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const avatar = getObject(id, 'avatar')

    if (avatar === null) {
        throw render(404, `Avatar with id ${id} doesn't exist`)
    }

    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { avatar, priceHistory }
}

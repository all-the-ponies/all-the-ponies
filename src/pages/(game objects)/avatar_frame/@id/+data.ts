import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import type { AvatarFrameType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    avatar_frame: AvatarFrameType,
    priceHistory: PriceHistoryType | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const avatar_frame = getObject(id, 'avatar_frame')

    if (avatar_frame === null) {
        throw render(404, `Avatar frame with id ${id} doesn't exist`)
    }

    console.log('getting price history')
    let priceHistory: PriceHistoryType = null
    try {
        priceHistory = await api.getPriceHistory(id)
    } catch {
        priceHistory = null
    }

    return { avatar_frame, priceHistory }
}

import api from "@/scripts/api"
import type { PriceHistoryType } from "@/scripts/api.types"
import { getObject } from "@/scripts/gameData"
import type { TokenType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    token: TokenType
}

export async function data(pageContext: PageContext) {
    const { id } = pageContext.routeParams
    
    const token = getObject(id, 'token')

    if (token === null) {
        throw render(404, `Token with id ${id} doesn't exist`)
    }

    return { token } as Data
}

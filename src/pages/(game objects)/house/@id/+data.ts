import { getObject } from "@/scripts/gameData"
import type { HouseType } from "@/types/gameDataTypes"
import { render } from "vike/abort"
import type { PageContext } from "vike/types"

export interface Data {
    house: HouseType,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const { id } = pageContext.routeParams
    
    const house = getObject(id, 'house')

    if (house === null) {
        throw render(404, `House with id ${id} doesn't exist`)
    }

    return { house }
}

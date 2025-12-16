import type { TDateISO } from "@/types/date.js"
import { isLocalhost } from "./common.js"
import type { GameObjectId } from "@/types/gameDataTypes.js"

const API_DOMAIN = 'https://all-the-ponies-api.vercel.app/'

const LOCALHOST_API_DOMAIN = (() => {
    const url = new URL(location.origin)
    url.port = '5501'
    return url.origin
})()

async function request(pathname: string, query: Record<string, string | number | null> = {}) {
    let url: URL, response: Response

    function createUrl(localhost = false) {
        let url = new URL(localhost ? LOCALHOST_API_DOMAIN : API_DOMAIN)
        url.pathname = pathname
        for (let [key, value] of Object.entries(query)) {
            url.searchParams.set(key, String(value))
        }

        return url
    }

    url = createUrl(isLocalhost())

    
    if (isLocalhost()) {
        response = await fetch(String(url)).catch(err => {
            console.warn(err)
            return null
        })
        if (response !== null) {
            return response
        }

        url = createUrl(false)
    }

    response = await fetch(String(url))

    return response
}

async function getShop() {
    const result = (await request(`/sales/shop/`)).json()

    return result
}

interface ResponseError {
    detail: string,
}

interface SaveData {
    version: number,
    player_info: {
        join_date: TDateISO,
        total_playtime: number
    },
    inventory: {
        ponies: {
            id: GameObjectId,
            level: 0 | 1 | 2 | 3 | 4 | 5,
            next_minigame: number,
        }[],
        shops: GameObjectId[],
    }
}

async function getSave(friendCode: string): Promise<SaveData | ResponseError> {
    const result: SaveData | ResponseError = await (await request(`/save/${friendCode.toLowerCase().trim()}/inventory/`)).json()

    return result
}


export default {
    API_DOMAIN,
    getSave,
    getShop,
}

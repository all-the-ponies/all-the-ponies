import { FRIEND_CODE_PATTERN } from "@/globals/constants.js"
import type { GameObjectId } from "@/types/gameDataTypes.js"
import ky from 'ky'
import type { LTSEvents, MazeProgress, PriceHistoryType, SaveData, ShopEntry } from "./api.types.js"
import { isDev } from "./common.js"

const API_DOMAIN = 'https://api.all-the-ponies.com'

const LOCALHOST_API_DOMAIN = (() => {
    const url = new URL(import.meta.env.SSR ? 'http://localhost' : location.origin)
    url.port = '5001'
    return url.origin
})()

const api = ky.create({
    
    baseUrl: isDev() ? LOCALHOST_API_DOMAIN : API_DOMAIN,
    retry: isDev() ? 1 : 0,
    hooks: {
        beforeRetry: [
            ({request, options, error, retryCount}) => {
                if (retryCount && isDev()) {
                    console.log('Retrying', error.message == "Failed to fetch")
                    return new Request(
                        request.url.replace(LOCALHOST_API_DOMAIN, API_DOMAIN),
                        request,
                    )
                }
            }
        ]
    }
})

async function getSave(friendCode: string): Promise<SaveData> {
    friendCode = friendCode.trim().toLocaleLowerCase()
    if (!FRIEND_CODE_PATTERN.test(friendCode)) {
        throw new Error(`Invalid friend code "${friendCode}"`)
    }
    
    const response = await api.get<SaveData>(`save/${friendCode}/inventory/`)
    const body = await response.text()
    
    if (!response.ok) {
        throw new Error(body)
    }

    try {
        return JSON.parse(body)
    } catch (error) {
        throw new Error(body)
    }    
}

async function getMazeProgress(friendCode: string) {
    friendCode = friendCode.trim().toLocaleLowerCase()
    if (!FRIEND_CODE_PATTERN.test(friendCode)) {
        throw new Error(`Invalid friend code "${friendCode}"`)
    }

    const result = await api.get<MazeProgress>(`save/${friendCode.toLowerCase().trim()}/maze_progress`).json()

    return result
}

async function getShop(): Promise<ShopEntry[]> {
    const response = await api.get<ShopEntry[]>('shop')

    const body = await response.text()

    if (!response.ok) {
        throw new Error(body)
    }
    
    try {
        return JSON.parse(body)
    } catch (error) {
        throw new Error(body)
    }
}

async function getPriceHistory(item: GameObjectId) {
    const result = api.get<PriceHistoryType>(`shop/history/${item}/`).json()

    return result
}


async function getLTSEvents() {
    const result = await api.get<LTSEvents>('events/lts').json()
    return result
}


export default {
    API_DOMAIN,
    getSave,
    getMazeProgress,
    getShop,
    getPriceHistory,
    getLTSEvents,
}

import { isDev } from "./common"

const ASSETS_URL = __BASE_URL__

export function createAssetUrl(asset: string) {
    if (!asset) {
        return null
    }

    let baseUrl: string
    if (typeof location !== 'undefined') {
        baseUrl = location.origin
    } else if (isDev()) {
        baseUrl = 'http://localhost:5000'
    } else {
        baseUrl = __BASE_URL__
    }

    if (!baseUrl.endsWith('/')) {
        baseUrl += '/'
    }
    
    baseUrl = `${baseUrl}game-assets/`

    const url = new URL(asset, baseUrl)
    return String(url)
}

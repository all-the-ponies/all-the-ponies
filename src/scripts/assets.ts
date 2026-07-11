import { isDev } from "./common"

interface Options {
    direct?: boolean
}

export function createAssetUrl(
    asset: string,
    {direct = false}: Options = {},
) {
    if (!asset) {
        return null
    }

    let basePath = 'game-assets/'

    let baseUrl: string
    if (direct || (typeof process !== 'undefined' && process.env.GENERATING_SITEMAP)) {
        baseUrl = 'https://assets.all-the-ponies.com/'
        basePath = ''
    } else if (typeof location !== 'undefined') {
        baseUrl = location.origin
    } else if (isDev()) {
        baseUrl = 'http://localhost:5000'
    } else if (typeof __BASE_URL__ !== 'undefined') {
        baseUrl = __BASE_URL__
    } else {
        baseUrl = 'https://assets.all-the-ponies.com/'
        basePath = ''
    }

    if (!baseUrl.endsWith('/')) {
        baseUrl += '/'
    }
    
    baseUrl = baseUrl + basePath

    const url = new URL(asset, baseUrl)
    // console.log('Getting asset', String(url))
    return String(url)
}

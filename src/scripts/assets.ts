import { ASSETS_PROXY_PATH, getDevAssetsUrl, PUBLIC_ASSETS_URL } from './assetConfig'

interface Options {
    /**
     * Force the canonical public asset URL, bypassing the dev proxy.
     * Used where an absolute public URL is required, such as OG images.
     */
    direct?: boolean
}

export function createAssetUrl(
    asset: string,
    {direct = false}: Options = {},
) {
    if (!asset) {
        return null
    }

    const key = asset.replace(/^\//, '')

    if (!direct && getDevAssetsUrl()) {
        // Use the same-origin dev proxy so asset URLs also work when the
        // site is opened from another device on the local network.
        return ASSETS_PROXY_PATH + key
    }

    return String(new URL(key, PUBLIC_ASSETS_URL))
}

const ASSETS_URL = 'https://assets.all-the-ponies.com'

export function createAssetUrl(asset: string) {
    if (!asset) {
        return null
    }
    
    const url = new URL(asset, ASSETS_URL)
    return String(url)
}

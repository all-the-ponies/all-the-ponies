export const PUBLIC_ASSETS_URL = 'https://assets.all-the-ponies.com/'
export const ASSETS_PROXY_PATH = '/game-assets/'

export function getDevAssetsUrl(): string | undefined {
    // Injected by Vite at build time for client/SSR bundles.
    if (typeof __DEV_ASSETS_URL__ !== 'undefined' && __DEV_ASSETS_URL__) {
        return __DEV_ASSETS_URL__
    }

    // Available when running outside Vite, e.g. the sitemap script.
    if (typeof process !== 'undefined' && process.env.DEV_ASSETS_URL) {
        return process.env.DEV_ASSETS_URL
    }
}

export function ensureTrailingSlash(value: string) {
    return value.endsWith('/') ? value : `${value}/`
}

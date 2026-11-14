import ky, { HTTPError, type Options } from 'ky'
import {
    ASSETS_PROXY_PATH,
    ensureTrailingSlash,
    getDevAssetsUrl,
    PUBLIC_ASSETS_URL,
} from './assetConfig'

const MANIFEST_KEY = 'manifest.json'
const DEV_REQUEST_TIMEOUT = 3000

const isBrowser = typeof window !== 'undefined'

function isSitemap() {
    return typeof process !== 'undefined' && process.env.GENERATING_SITEMAP === 'true'
}

type AssetSource =
    | { kind: 'r2'; bucket: R2Bucket }
    | { kind: 'url'; base: string }

let sourcePromise: Promise<AssetSource> | undefined
let manifestBase: string | undefined
let manifestPromise: Promise<Record<string, string>> | undefined

function isUnreachableError(error: unknown) {
    if (error instanceof HTTPError) {
        // The dev proxy could not reach its upstream.
        return [502, 503, 504].includes(error.response.status)
    }

    return error instanceof TypeError
        || (error as Error)?.name === 'TimeoutError'
        || (error as Error)?.name === 'AbortError'
}

function getDevFetchBase(devAssetsUrl: string) {
    if (isBrowser) {
        // In the browser, go through our own server so the URL works from
        // any device on the network and can be cached like a normal asset.
        return new URL(ASSETS_PROXY_PATH, location.origin).toString()
    }

    // The server and sitemap can talk to the dev asset server directly.
    return ensureTrailingSlash(devAssetsUrl)
}

async function getBucket(): Promise<R2Bucket | null> {
    try {
        const cloudflareModule = 'cloudflare:workers'
        const { env } = await import(/* @vite-ignore */ cloudflareModule)
        return env.GAME_ASSETS_BUCKET ?? null
    } catch {
        return null
    }
}

function fetchManifest(base: string) {
    if (manifestBase !== base) {
        manifestBase = base
        manifestPromise = ky
            .get(new URL(MANIFEST_KEY, base), {
                retry: 0,
                timeout: DEV_REQUEST_TIMEOUT,
            })
            .json<Record<string, string>>()
    }

    return manifestPromise
}

async function resolveAssetSource(): Promise<AssetSource> {
    if (sourcePromise) {
        return sourcePromise
    }

    sourcePromise = (async () => {
        const devAssetsUrl = getDevAssetsUrl()

        if (devAssetsUrl) {
            const base = getDevFetchBase(devAssetsUrl)

            try {
                // Probe with the manifest. This also warms the manifest cache
                // so we don't make every caller retry the dev server.
                await fetchManifest(base)
                return { kind: 'url', base }
            } catch (error) {
                if (!isUnreachableError(error)) {
                    // The dev server is reachable but something is wrong with
                    // the URL or the files. Surface that instead of silently
                    // serving production data.
                    throw error
                }

                manifestBase = undefined
                manifestPromise = undefined

                console.warn(
                    `Could not reach DEV_ASSETS_URL at ${base}; `
                    + `falling back to ${PUBLIC_ASSETS_URL}`,
                )
            }
        }

        if (!isBrowser && !isSitemap()) {
            const bucket = await getBucket()
            if (bucket) {
                // The local R2 binding is simulated and starts empty, so only
                // use it once it has actually been populated. This also means
                // local development falls back to the public assets URL when
                // remote bindings are disabled.
                const manifest = await bucket.head(MANIFEST_KEY)
                if (manifest) {
                    return { kind: 'r2', bucket }
                }

                console.warn(
                    `GAME_ASSETS_BUCKET has no ${MANIFEST_KEY}; `
                    + `falling back to ${PUBLIC_ASSETS_URL}`,
                )
            }
        }

        return { kind: 'url', base: PUBLIC_ASSETS_URL }
    })()

    return sourcePromise
}

export async function getAssetManifest(): Promise<Record<string, string>> {
    const source = await resolveAssetSource()

    if (source.kind === 'r2') {
        return {}
    }

    return fetchManifest(source.base)
}

type AssetOptions = Pick<Options, 'signal' | 'cache' | 'credentials' | 'redirect' | 'timeout'> & {version?: string}

/**
 * Fetch an asset and return its response.
 *
 * Uses the dev proxy when DEV_ASSETS_URL is set, the R2 binding on the
 * server when available, and the public assets URL otherwise.
 */
export async function fetchAsset(key: string, {version, ...options}: AssetOptions = {}): Promise<Response> {
    const source = await resolveAssetSource()
    const assetKey = key.replace(/^\//, '')

    if (source.kind === 'r2') {
        const object = await source.bucket.get(assetKey)
        if (!object) {
            throw new Error(`Could not find asset ${assetKey}`)
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)

        return new Response(object.body, { headers })
    }

    const url = new URL(assetKey, source.base)

    if (assetKey !== MANIFEST_KEY) {
        const assetVersion = version ?? (await fetchManifest(source.base))[assetKey]
        if (assetVersion) {
            url.searchParams.set('v', assetVersion)
        }
    }

    return await ky.get(url, { retry: 0, ...options })
}

export async function fetchAssetJson<T>(key: string, options: AssetOptions = {}): Promise<T> {
    const response = await fetchAsset(key, options)
    return await response.json() as T
}

import { LOCALES } from "@/i18n";
import gameData from "@/scripts/gameData";
import type { Context, Next } from "hono"
import { streamText } from 'hono/streaming'
import { SitemapIndexStream, SitemapStream, streamToPromise } from 'sitemap'

const BASE_URL = __BASE_URL__
const CHUNK_SIZE = 1000
const CATEGORY_NAMES = [
    'pony',
    'house',
    'shop',
    'decor',
    'avatar',
]

function extractSitemapId(id: string) {
    return Number(id.match(/[0-9]+/gm)[0])
}

export async function sitemapIndex(c: Context) {
    const sitemapIndex = new SitemapIndexStream()
    
    return streamText(c, async(stream) => {
        c.header('Content-Type', 'application/xml')
        const indexPromise = streamToPromise(sitemapIndex).then((data) => data.toString())

        sitemapIndex.write({
            url: String(new URL('/sitemap/pages.xml', BASE_URL)),
        })

        CATEGORY_NAMES.forEach((category) => {
            const chunks = Math.ceil(
                Object.keys(gameData.data.categories[category].objects).length / CHUNK_SIZE
            )
    
            for (let i = 0; i < chunks; i++) {
                sitemapIndex.write({
                    url: String(new URL(`/sitemap/${category}/${i}.xml`, BASE_URL)),
                    lastmod: new Date(__BUILD_DATE__).toISOString(),
                })
            }
        })

        sitemapIndex.end()

        const xmlIndex = await indexPromise
        await stream.write(xmlIndex)
    })
}

export async function pagesSitemap(c: Context) {
    const pages = [
        { path: '/', priority: 1.0, changeFreq: 'monthly' },
        { path: '/quiz/', priority: 0.8, changeFreq: 'monthly' },
        { path: '/guesser/', priority: 0.8, changeFreq: 'monthly' },
        { path: '/inventory/', priority: 0.6, changeFreq: 'monthly' },
        { path: '/stats/', priority: 0.5, changeFreq: 'monthly' },
        { path: '/store/', priority: 0.8, changeFreq: 'daily' },
        { path: '/about/', priority: 0.7, changeFreq: 'monthly' },
        { path: '/contact/', priority: 0.8, changeFreq: 'monthly' },

        { path: '/search/ponies/', priority: 0.8, changeFreq: 'weekly' },
        { path: '/search/houses/', priority: 0.8, changeFreq: 'weekly' },
        { path: '/search/shops/', priority: 0.8, changeFreq: 'weekly' },
        { path: '/search/decor/', priority: 0.8, changeFreq: 'weekly' },
        { path: '/search/avatars/', priority: 0.8, changeFreq: 'weekly' },
    ]
    
    const sitemapStream = new SitemapStream({
        hostname: BASE_URL,
    })

    const locales = Object.keys(LOCALES)

    return streamText(c, async (stream) => {
        c.header('Content-Type', 'application/xml')

        const sitemapPromise = streamToPromise(sitemapStream).then((data) => data.toString())

        pages.forEach((page) => {
            locales.forEach((locale) => {
                sitemapStream.write({
                    url: `/${locale}${page.path}`,
                    links: locales.map((l) => ({
                        lang: l,
                        url: String(new URL(`/${l}${page.path}`, BASE_URL)),
                    })),
                    changefreq: page.changeFreq,
                    priority: page.priority,
                    lastmod: new Date(__BUILD_DATE__).toISOString(),
                })
            })
        })

        sitemapStream.end()

        const fullXml = await sitemapPromise
        await stream.write(fullXml)
    })
}

export async function gameObjectSitemap(c: Context, next: Next) {
    const sitemapStream = new SitemapStream({
        hostname: BASE_URL,
    })

    const chunkId = extractSitemapId(c.req.param('id'))
    const category = c.req.param('category')
    const start = chunkId * CHUNK_SIZE

    console.log('sitemap category', category)
    if (!CATEGORY_NAMES.includes(category)) {
        await next()
        return
    }

    const chunk = Object.keys(gameData.data.categories[category].objects).slice(start, start + CHUNK_SIZE)

    const locales = Object.keys(LOCALES)

    return streamText(c, async (stream) => {
        c.header('Content-Type', 'application/xml')

        const sitemapPromise = streamToPromise(sitemapStream).then((data) => data.toString())

        chunk.forEach((pony) => {
            locales.forEach((locale) => {
                sitemapStream.write({
                    url: `/${locale}${pony}`,
                    links: locales.map((l) => ({
                        lang: l,
                        url: String(new URL(`/${l}/${category}/${pony}`, BASE_URL)),
                    })),
                    changefreq: 'monthly',
                    priority: 0.8,
                    lastmod: new Date(__BUILD_DATE__).toISOString(),
                })
            })
        })

        sitemapStream.end()

        const fullXml = await sitemapPromise
        await stream.write(fullXml)
    })
}

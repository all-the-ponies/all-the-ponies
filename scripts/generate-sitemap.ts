import { LOCALES } from "../src/i18n"
import { loadGameData } from "../src/scripts/gameData"
import fs from 'fs'
import path from "path"
import { resolve } from 'path'
import { Readable } from 'stream'
import { SitemapAndIndexStream, SitemapStream } from 'sitemap'

const gameData = await loadGameData()
const gameObjects = gameData.gameObjects

const BASE_URL = 'https://all-the-ponies.com'
// const CHUNK_SIZE = 1000
const CATEGORY_NAMES = [
    'pony',
    'house',
    'shop',
    'decor',
    'avatar',
    'avatar_frame',
    'background',
    'background_frame',
    'cutie_mark',
    'pet',
]

const LOCALE_CODES = Object.keys(LOCALES)

const PAGES = [
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

console.log('Creating sitemaps')
const sitemapStream = new SitemapAndIndexStream({
    limit: 10_000, // defaults to 45k
    lastmodDateOnly: false, // print date not time
    // SitemapAndIndexStream will call this user provided function every time
    // it needs to create a new sitemap file. You merely need to return a stream
    // for it to write the sitemap urls to and the expected url where that sitemap will be hosted
    getSitemapStream: (i) => {
        const sitemapStream = new SitemapStream({ hostname: BASE_URL });
        // if your server automatically serves sitemap.xml.gz when requesting sitemap.xml leave this line be
        // otherwise you will need to add .gz here and remove it a couple lines below so that both the index 
        // and the actual file have a .gz extension
        const destPath = `./sitemap/sitemap-${i}.xml`; 

        const output = resolve('dist', 'client', destPath)
        console.log(`Writing ${output}`)
        fs.mkdirSync(path.dirname(output), {
            recursive: true,
        })
        const ws = sitemapStream
            .pipe(fs.createWriteStream(output)); // write it to sitemap-NUMBER.xml
        

        return [new URL(destPath, BASE_URL).toString(), sitemapStream, ws];
    },
})

sitemapStream
    .pipe(fs.createWriteStream(resolve('dist', 'client', 'sitemap.xml')))


PAGES.forEach((page) => {
    LOCALE_CODES.forEach((locale) => {
        sitemapStream.write({
            url: `/${locale}${page.path}`,
            links: LOCALE_CODES.map((l) => ({
                lang: l,
                url: String(new URL(`/${l}${page.path}`, BASE_URL)),
            })),
            changefreq: page.changeFreq,
            priority: page.priority,
            lastmod: false,
        })
    })
})


for (let category of CATEGORY_NAMES) {
    for (let gameObject of Object.keys(gameObjects[category].objects)) {
        for (let locale of LOCALE_CODES) {
            sitemapStream.write({
                url: `/${locale}/${category}/${gameObject}/`,
                links: LOCALE_CODES.map((l) => ({
                    lang: l,
                    url: String(new URL(`/${l}/${category}/${gameObject}/`, BASE_URL)),
                })),
                changefreq: 'monthly',
                priority: 0.8,
                lastmod: false,
            })
        }
    }
}


sitemapStream.end()

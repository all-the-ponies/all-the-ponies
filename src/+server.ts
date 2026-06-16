import vike from '@vikejs/hono'
import { Hono } from 'hono'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status';
import type { Server } from 'vike/types'

interface Bindings {
	GAME_ASSETS_BUCKET: R2Bucket;
	WEBLATE_API_TOKEN: string;
}


function getApp() {
    console.log('starting server')
    const app = new Hono<{ Bindings: Bindings }>()
    app.use('/game-assets/*', async (c) => {
        const url = new URL(c.req.url)

        const key = url.pathname.replace('/game-assets/', '')

        console.log('Fetching asset', key)

        let object: R2Object | R2ObjectBody

        const requestHeaders = new Headers(c.req.header())

        switch (c.req.method) {
            case 'GET':
                object = await c.env.GAME_ASSETS_BUCKET.get(key, {
                  onlyIf: requestHeaders,
                  range: requestHeaders,
                })
                break
            case 'HEAD':
                object = await c.env.GAME_ASSETS_BUCKET.head(key)
                break
            default:
                return c.text('Method not allowed', 405, {
                    Allow: "GET HEAD",
                })
        }


        if (!object) {
            return c.text('Asset Not Found', 404)
        }

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        
        headers.set('etag', object.httpEtag)

        if (object.customMetadata) {
            for (const [key, value] of Object.entries(object.customMetadata)) {
                headers.set(`X-Asset-${key}`, value)
            }
        }

        let status: ContentfulStatusCode | StatusCode = 500

        if ('body' in object) {
            status = 200
        } else if (!c.req.header('If-Match')) {
            status = 304
        } else {
            status = 412
        }

        return c.body(
            "body" in object ? object.body : undefined,
            status,
            Object.fromEntries(headers.entries()),
        );
    })
    app.use('*', async (c, next) => {
        if (c.req.method === 'HEAD') {
            // Manually override the method to GET so it matches app.get() routes
            const getRequest = new Request(c.req.raw, { method: 'GET' })
            const res = await app.fetch(getRequest, c.env)
            
            // Return the GET response but with an empty body (per HTTP spec)
            return new Response(null, res)
        }
        await next()
    })
    vike(app)
    return app
}

const app = getApp()

export default {
    fetch: app.fetch,
} satisfies Server

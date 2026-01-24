// server/index.js

import { Hono } from 'hono'
import { apply, serve } from '@photonjs/hono'
import { pagesSitemap, gameObjectSitemap, sitemapIndex } from './sitemap-controller'

function startServer() {
    console.log('starting server')
    const app = new Hono()
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
    app.get('/sitemap.xml', sitemapIndex)
    app.get('/sitemap/pages.xml', pagesSitemap)
    app.get('/sitemap/:category/:id{[0-9]+\\.xml}', gameObjectSitemap)
    app.get('robots.txt', (c) => {
        return c.text(
            "User-Agent: *\n\n" + 
            "Allow: /\n\n" +
            `Sitemap: ${String(new URL('/sitemap.xml', __BASE_URL__))}\n`,
        )
    })
    apply(app)
    return serve(app)
}

export default startServer()

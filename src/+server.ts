import vike from '@vikejs/hono'
import { Hono } from 'hono'
import type { Server } from 'vike/types'


function getApp() {
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
    vike(app)
    return app
}

const app = getApp()

export default {
    fetch: app.fetch,
} satisfies Server

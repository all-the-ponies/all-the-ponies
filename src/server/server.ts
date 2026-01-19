// server/index.js

import express from 'express'
import { apply, serve } from '@photonjs/express'

function startServer() {
    console.log('starting server')
    const app = express()
    apply(app)
    return serve(app)
}

export default startServer()

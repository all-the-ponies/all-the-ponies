// server/index.js

import { Hono } from 'hono'
import { apply, serve } from '@photonjs/hono'

function startServer() {
  console.log('starting server')
  const app = new Hono()
  apply(app)
  return serve(app)
}

export default startServer()

import {test, after} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'

const data = Buffer.from('model from the local asset bucket')
const model = {path: 'models/3d/Pony_Test.glb', sha256: 'a'.repeat(64), bytes: data.length,
    rigKey: 'b'.repeat(64), animations: []}
const version = 'c'.repeat(64)
const requests: URL[] = []
let available = true
const server = createServer((request, response) => {
    const url = new URL(request.url!, 'http://localhost')
    requests.push(url)
    response.setHeader('content-type', 'application/json')
    if (url.pathname === '/game-assets/manifest.json') {
        response.end(JSON.stringify(available ? {'models_3d.json': version} : {}))
    } else if (url.pathname === '/game-assets/models_3d.json') {
        response.end(JSON.stringify({schemaVersion: 1, models: {Pony_Test: model}}))
    } else if (url.pathname === '/game-assets/models/3d/Pony_Test.glb') {
        response.end(data)
    } else {
        response.writeHead(404).end()
    }
})
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const origin = 'http://127.0.0.1:' + (server.address() as import('node:net').AddressInfo).port
const originalDevUrl = process.env.DEV_ASSETS_URL
process.env.DEV_ASSETS_URL = origin + '/all-the-ponies-assets'
Object.assign(globalThis, {window: {}, location: new URL(origin)})
after(async () => {
    try {
        available = false
        await resolveModel('Pony_Test', new AbortController().signal)
    } finally {
        server.close()
        delete (globalThis as any).window
        delete (globalThis as any).location
        if (originalDevUrl === undefined) delete process.env.DEV_ASSETS_URL
        else process.env.DEV_ASSETS_URL = originalDevUrl
    }
})
const {resolveModel, fetchBytes} = await import('../../src/components/model-viewer/assets')

test('the full-site development proxy resolves a catalogue and model from the same origin', async () => {
    const signal = new AbortController().signal
    const resolved = await resolveModel('Pony_Test', signal)
    assert.deepEqual(resolved, model)
    assert.deepEqual(Buffer.from(await fetchBytes(resolved!, signal)), data)
    assert.equal(requests.find(url => url.pathname.endsWith('models_3d.json'))!.searchParams.get('v'), version)
    assert.equal(requests.find(url => url.pathname.endsWith('Pony_Test.glb'))!.searchParams.get('v'), model.sha256)
})

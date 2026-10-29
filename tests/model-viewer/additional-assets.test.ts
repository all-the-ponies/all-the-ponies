import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { resolveModel } from '../../src/components/model-viewer/assets'

const originalFetch = globalThis.fetch
afterEach(async () => {
    globalThis.fetch = async () => Response.json({})
    await resolveModel('Pony_Test', new AbortController().signal)
    globalThis.fetch = originalFetch
})
const asset = (key: string, rig: string) => ({ path: `models/3d/${key.repeat(64)}.glb`, sha256: key.repeat(64), bytes: 100, rigKey: rig.repeat(64) })
const actor = (key: string, rig: string) => ({ ...asset(key, rig), animations: [{ ...asset('b', rig), id: 'first', name: 'first', duration: 1 }] })
const additional = () => ({ model: actor('c', 'd'), parentRoot: 2, controller: 'native-first-then-random-v1',
    transform: [2,0,0,0, 0,2,0,0, 0,0,2,0, 3,4,5,1] })
async function resolve(schemaVersion: number, child: unknown) {
    const model = { ...actor('a', 'a'), additionalActor: child }
    const catalogue = {schemaVersion, models: {Pony_Test: model}}
    const version = createHash('sha256').update(JSON.stringify(catalogue)).digest('hex')
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? { 'models_3d.json': version } : catalogue)
    return resolveModel('Pony_Test', new AbortController().signal)
}

test('schema 2 and 3 preserve independent child rigs, placement and native animation paths', async () => {
    const child = additional()
    const animation = child.model.animations[0]
    animation.path = `models/3d/anim/${animation.sha256}/${animation.id}.glb`
    for (const version of [2, 3]) {
        assert.deepEqual((await resolve(version, child))?.additionalActor, child)
    }
})

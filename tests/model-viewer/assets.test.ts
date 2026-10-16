import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { resolveModel, verifiedBytes, disposeGLTF } from '../../src/components/model-viewer/assets.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })
const signal = () => new AbortController().signal
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const bytes = Buffer.from('binary fixture')
const ref = { path: `models/3d/${hash(bytes)}.glb`, sha256: hash(bytes), bytes: bytes.length, rigKey: 'a'.repeat(64) }
const model = { ...ref, animations: [{ ...ref, id: 'move', name: 'Move', duration: 1e-9 }] }

test('semantic catalogue survives uploader JSON formatting and uses uploaded manifest version', async () => {
    // Python's uploader also changes exponent spelling; these two JSON payloads
    // have the same data but different raw hashes, intentionally not compared.
    const source = JSON.stringify({ schemaVersion: 1, models: { Pony_Test: model } }) + '\n'
    const uploaded = source.replace('1e-9', '1e-09').trim()
    assert.notEqual(hash(source), hash(uploaded))
    const requests: URL[] = []
    globalThis.fetch = async input => {
        const url = new URL(String(input)); requests.push(url)
        return new Response(url.pathname === '/manifest.json'
            ? JSON.stringify({ 'models_3d.json': hash(uploaded) }) : uploaded)
    }
    assert.deepEqual(await resolveModel('Pony_Test', signal()), model)
    assert.equal(requests[1].origin, 'https://assets.all-the-ponies.com')
    assert.equal(requests[1].pathname, '/models_3d.json')
    assert.equal(requests[1].searchParams.get('v'), hash(uploaded))
})

test('unknown identities do not substitute a model', async () => {
    globalThis.fetch = async input => new Response(String(input).includes('manifest.json')
        ? JSON.stringify({ 'models_3d.json': 'b'.repeat(64) })
        : JSON.stringify({ schemaVersion: 1, models: { Pony_Test: model } }))
    assert.equal(await resolveModel('Pony_Missing', signal()), null)
})

test('shared GPU objects and image bitmaps are each released once across scenes', () => {
    const counts = { geometry: 0, skeleton: 0, material: 0, texture: 0, bitmap: 0 }
    const texture = { isTexture: true, source: { data: { close() { counts.bitmap++ } } }, dispose() { counts.texture++ } }
    const object = {
        geometry: { dispose() { counts.geometry++ } }, skeleton: { dispose() { counts.skeleton++ } },
        material: [{ map: texture, dispose() { counts.material++ } }],
    }
    disposeGLTF({ scenes: [0, 1].map(() => ({ traverse(fn) { fn(object) } })) } as any)
    assert.deepEqual(counts, { geometry: 1, skeleton: 1, material: 1, texture: 1, bitmap: 1 })
})

test('fixed Object ID models revalidate while native named animations remain shared and cached', async () => {
    const animation = { ...model.animations[0], path: `models/3d/${ref.sha256}/move.glb` }
    const named = (id: string) => ({ ...ref, path: `models/3d/${id}.glb`, animations: [animation] })
    const catalogue = { schemaVersion: 1, models: { Pony_Test: named('Pony_Test'), Pet_Test: named('Pet_Test') } }
    const fetched: string[] = []
    globalThis.fetch = async (input, options) => {
        const path = new URL(String(input)).pathname.slice(1); fetched.push(path)
        if (path === 'manifest.json') return Response.json({ 'models_3d.json': 'b'.repeat(64) })
        if (path === 'models_3d.json') return Response.json(catalogue)
        assert.ok([catalogue.models.Pony_Test.path, catalogue.models.Pet_Test.path, animation.path].includes(path))
        assert.equal(options.cache, path === animation.path ? 'default' : 'no-cache')
        return new Response(bytes)
    }
    const pony = await resolveModel('Pony_Test', signal())
    const pet = await resolveModel('Pet_Test', signal())
    assert.deepEqual(pony, catalogue.models.Pony_Test)
    assert.deepEqual(pet, catalogue.models.Pet_Test)
    assert.equal(pony!.animations[0].path, pet!.animations[0].path)
    for (const resource of [pony!, pet!, animation]) {
        assert.deepEqual(Buffer.from(await verifiedBytes(resource, signal())), bytes)
    }
    assert.equal(fetched.filter(path => path.endsWith('.glb')).length, 3)
})

test('overwritten fixed models reject stale references and load after resolving the new catalogue', async () => {
    const fixed = { ...model, path: 'models/3d/Pony_Test.glb' }
    const newer = Buffer.alloc(bytes.length, 1)
    const updated = { ...fixed, sha256: hash(newer) }
    let current = fixed
    globalThis.fetch = async (input, options) => {
        const path = new URL(String(input)).pathname
        if (path === '/manifest.json') return Response.json({ 'models_3d.json': 'b'.repeat(64) })
        if (path === '/models_3d.json') return Response.json({ schemaVersion: 1, models: { Pony_Test: current } })
        assert.equal(path, '/models/3d/Pony_Test.glb')
        assert.equal(options.cache, 'no-cache')
        return new Response(newer)
    }
    const previous = await resolveModel('Pony_Test', signal())
    await assert.rejects(verifiedBytes(previous!, signal()), /digest mismatch/)
    current = updated
    const latest = await resolveModel('Pony_Test', signal())
    assert.equal(latest!.path, previous!.path)
    assert.deepEqual(Buffer.from(await verifiedBytes(latest!, signal())), newer)
})

test('catalogue v3 explicitly enables only exported native click and dizzy identities', async () => {
    const interactions = {version: 1, clickAnimations: ['move'], dizzyAnimation: 'move'}
    let catalogue: any = {schemaVersion: 3, models: {Pony_Test: {...model, interactions}}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? {'models_3d.json': 'b'.repeat(64)} : catalogue)
    assert.deepEqual((await resolveModel('Pony_Test', signal()))!.interactions, interactions)
    catalogue.models.Pony_Test.interactions = {...interactions, clickAnimations: ['missing']}
    await assert.rejects(resolveModel('Pony_Test', signal()))
    catalogue.models.Pony_Test.interactions = interactions
    for (const version of [1, 2]) {
        catalogue.schemaVersion = version
        await assert.rejects(resolveModel('Pony_Test', signal()), /Unsupported interaction controller/)
    }
})


test('catalogue event bindings and preferred clips require valid explicit references', async () => {
    const interactions = {version: 1, clickAnimations: []}
    const animation = {...model.animations[0], eventBinding: {version: 1, events: [
        {frame: 0, type: 'SubObject', meshes: [2], visible: true},
    ]}}
    const selected = {...model, animations: [animation], interactions, preferredAnimations: ['move']}
    const catalogue: any = {schemaVersion: 4, models: {Pony_Test: selected}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? {'models_3d.json': 'b'.repeat(64)} : catalogue)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), selected)
    catalogue.schemaVersion = 3
    await assert.rejects(resolveModel('Pony_Test', signal()), /version 4/)
    catalogue.schemaVersion = 4
    catalogue.models.Pony_Test = {...selected, preferredAnimations: ['absent']}
    await assert.rejects(resolveModel('Pony_Test', signal()), /preferred animation/)
    catalogue.models.Pony_Test = {...selected, preferredAnimations: ['move', 'move']}
    await assert.rejects(resolveModel('Pony_Test', signal()), /preferred animation/)
    catalogue.models.Pony_Test = {...selected, animations: [{...animation, eventBinding: {version: 2, events: []}}]}
    await assert.rejects(resolveModel('Pony_Test', signal()), /event binding/)
    catalogue.models.Pony_Test = {...selected}
    delete catalogue.models.Pony_Test.interactions
    await assert.rejects(resolveModel('Pony_Test', signal()), /require the native controller/)
})


test('schema 4 expands compact refs with bindings and shares table objects with additional actors', async () => {
    const base = model.animations[0]
    const other = {...base, id: 'other', name: 'Other'}
    const binding = {version: 1, events: [{frame: 0, type: 'SubObject', meshes: [2], visible: true}]}
    const catalogue = {schemaVersion: 4, animationAssets: [base, {...other, eventBinding: binding}], models: {Pony_Test: {
        ...model, interactions: {version: 1, clickAnimations: ['other']},
        animations: [0, 1], preferredAnimations: ['move'],
        additionalActor: {model: {...ref, animations: [0]}, parentRoot: 0,
            controller: 'native-first-then-random-v1', transform: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]},
    }}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? {'models_3d.json': 'b'.repeat(64)} : catalogue)
    const result = (await resolveModel('Pony_Test', signal()))!
    assert.deepEqual(result.animations, [base, {...other, eventBinding: binding}])
    assert.equal(result.animations[0], result.additionalActor!.model.animations[0])
    assert.deepEqual(result.animations[1].eventBinding, binding)
    assert.equal(result.additionalActor!.model.animations[0].eventBinding, undefined)
    assert.deepEqual(result.additionalActor!.model.animations, [base])
})

test('compact animation references reject old schemas, invalid indices and ambiguous binding wrappers', async () => {
    let catalogue: any
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? {'models_3d.json': 'b'.repeat(64)} : catalogue)
    for (const schemaVersion of [1, 2, 3]) {
        catalogue = {schemaVersion, animationAssets: [model.animations[0]], models: {Pony_Test: {...model, animations: [0]}}}
        await assert.rejects(resolveModel('Pony_Test', signal()), /catalogue version 4/)
    }
    for (const item of [-1, 1, .5, null, {asset: 0}, {asset: 0, eventBinding: {version: 1, events: []}},
        {asset: '0', eventBinding: {version: 1, events: []}},
        {asset: 0, eventBinding: {version: 1, events: []}, path: 'override'}]) {
        catalogue = {schemaVersion: 4, animationAssets: [model.animations[0]], models: {Pony_Test: {...model, animations: [item]}}}
        await assert.rejects(resolveModel('Pony_Test', signal()))
    }
    catalogue = {schemaVersion: 4, models: {Pony_Test: {...model, animations: [0]}}}
    await assert.rejects(resolveModel('Pony_Test', signal()), /animation asset/)
    catalogue = {schemaVersion: 4, animationAssets: [{...model.animations[0], eventBinding: {version: 2, events: []}}],
        models: {Pony_Test: {...model, animations: [0]}}}
    await assert.rejects(resolveModel('Pony_Test', signal()), /event binding/)
    catalogue = {schemaVersion: 4, animationAssets: [{...model.animations[0], rigKey: 'c'.repeat(64)}],
        models: {Pony_Test: {...model, animations: [0]}}}
    await assert.rejects(resolveModel('Pony_Test', signal()), /rig is incompatible/)
})

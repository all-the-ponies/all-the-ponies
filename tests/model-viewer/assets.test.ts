import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { resolveModel, fetchBytes, disposeGLTF } from '../../src/components/model-viewer/assets.ts'

const originalFetch = globalThis.fetch
afterEach(async () => {
    globalThis.fetch = async () => Response.json({})
    await resolveModel('Pony_Test', signal())
    globalThis.fetch = originalFetch
})
const signal = () => new AbortController().signal
const digest = 'b'.repeat(64)
const bytes = Buffer.from('binary fixture')
const ref = { path: `models/3d/${digest}.glb`, sha256: digest, bytes: bytes.length, rigKey: 'a'.repeat(64) }
const model = { ...ref, animations: [{ ...ref, id: 'move', name: 'Move', duration: 1e-9 }] }
const manifestFor = (catalogue: unknown) => ({'models_3d.json': createHash('sha256').update(JSON.stringify(catalogue)).digest('hex')})

test('semantic catalogue survives uploader JSON formatting and uses uploaded manifest version', async () => {
    // Python's uploader also changes exponent spelling without changing the data.
    const source = JSON.stringify({ schemaVersion: 1, models: { Pony_Test: model } }) + '\n'
    const uploaded = source.replace('1e-9', '1e-09').trim()
    const requests: URL[] = []
    globalThis.fetch = async input => {
        const url = new URL(String(input)); requests.push(url)
        return new Response(url.pathname === '/manifest.json'
            ? JSON.stringify({ 'models_3d.json': digest }) : uploaded)
    }
    assert.deepEqual(await resolveModel('Pony_Test', signal()), model)
    assert.equal(requests[1].origin, 'https://assets.all-the-ponies.com')
    assert.equal(requests[1].pathname, '/models_3d.json')
    assert.equal(requests[1].searchParams.get('v'), digest)
})

test('unknown identities do not substitute a model', async () => {
    globalThis.fetch = async input => new Response(String(input).includes('manifest.json')
        ? JSON.stringify({ 'models_3d.json': 'b'.repeat(64) })
        : JSON.stringify({ schemaVersion: 1, models: { Pony_Test: model } }))
    assert.equal(await resolveModel('Pony_Missing', signal()), null)
})

test('same catalogue version is fetched and parsed once across sequential and concurrent callers', async () => {
    let catalogueRequests = 0, catalogueParses = 0
    globalThis.fetch = async input => {
        if (String(input).includes('manifest.json')) return Response.json({'models_3d.json': '8'.repeat(64)})
        catalogueRequests++
        const response = Response.json({schemaVersion: 1, models: {Pony_Test: model}})
        const json = response.json.bind(response)
        response.json = () => { catalogueParses++; return json() }
        return response
    }
    const first = await resolveModel('Pony_Test', signal())
    const second = await resolveModel('Pony_Test', signal())
    const [third, fourth] = await Promise.all([resolveModel('Pony_Test', signal()), resolveModel('Pony_Test', signal())])
    for (const result of [first, second, third, fourth]) assert.deepEqual(result, model)
    assert.equal(catalogueRequests, 1)
    assert.equal(catalogueParses, 1)
    first!.animations[0].name = 'Changed in one session'
    assert.equal(second!.animations[0].name, 'Move')
    assert.equal(third!.animations[0].name, 'Move')
})

test('a failed catalogue request can be retried with the same manifest version', async () => {
    let catalogues = 0
    globalThis.fetch = async input => {
        if (String(input).includes('manifest.json')) return Response.json({'models_3d.json': digest})
        return ++catalogues === 1 ? new Response(null, {status: 503})
            : Response.json({schemaVersion: 1, models: {Pony_Test: model}})
    }
    await assert.rejects(resolveModel('Pony_Test', signal()), /503/)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), model)
    assert.equal(catalogues, 2)
})

test('canceling one waiting caller leaves the shared catalogue available to another', async () => {
    const started = Promise.withResolvers<void>(), response = Promise.withResolvers<Response>()
    let sharedSignal: AbortSignal, catalogues = 0
    globalThis.fetch = async (input, options) => {
        if (String(input).includes('manifest.json')) return Response.json({'models_3d.json': digest})
        catalogues++; sharedSignal = options!.signal!
        started.resolve()
        return response.promise
    }
    const canceled = new AbortController()
    const first = resolveModel('Pony_Test', canceled.signal)
    const rejected = assert.rejects(first, {name: 'AbortError'})
    const second = resolveModel('Pony_Test', signal())
    await started.promise
    await new Promise(setImmediate)
    canceled.abort()
    await rejected
    assert.equal(sharedSignal!.aborted, false)
    response.resolve(Response.json({schemaVersion: 1, models: {Pony_Test: model}}))
    assert.deepEqual(await second, model)
    assert.equal(catalogues, 1)
})

test('canceling every waiting caller aborts the transfer and allows a fresh request', async () => {
    const started = Promise.withResolvers<void>()
    let sharedSignal: AbortSignal, catalogues = 0
    globalThis.fetch = async (input, options) => {
        if (String(input).includes('manifest.json')) return Response.json({'models_3d.json': digest})
        if (++catalogues > 1) return Response.json({schemaVersion: 1, models: {Pony_Test: model}})
        sharedSignal = options!.signal!
        started.resolve()
        return new Promise((_, reject) => sharedSignal.addEventListener('abort', () => reject(sharedSignal.reason), {once: true}))
    }
    const canceled = new AbortController()
    const first = resolveModel('Pony_Test', canceled.signal)
    const rejected = assert.rejects(first, {name: 'AbortError'})
    await started.promise
    canceled.abort()
    await rejected
    assert.equal(sharedSignal!.aborted, true)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), model)
    assert.equal(catalogues, 2)
})

test('manifest changes replace the cache without a late older request replacing the new version', async () => {
    const started = Promise.withResolvers<void>(), oldResponse = Promise.withResolvers<Response>()
    const oldVersion = 'a'.repeat(64), newVersion = 'c'.repeat(64)
    let version = oldVersion, catalogues = 0
    const changed = {...model, animations: [{...model.animations[0], name: 'New'}]}
    globalThis.fetch = async input => {
        const url = new URL(String(input))
        if (url.pathname === '/manifest.json') return Response.json({'models_3d.json': version})
        catalogues++
        if (url.searchParams.get('v') === oldVersion) { started.resolve(); return oldResponse.promise }
        return Response.json({schemaVersion: 1, models: {Pony_Test: changed}})
    }
    const older = resolveModel('Pony_Test', signal())
    await started.promise
    version = newVersion
    assert.deepEqual(await resolveModel('Pony_Test', signal()), changed)
    oldResponse.resolve(Response.json({schemaVersion: 1, models: {Pony_Test: model}}))
    assert.deepEqual(await older, model)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), changed)
    assert.equal(catalogues, 2)
})

test('an idle catalogue expires while returned model data remains usable', async t => {
    t.mock.timers.enable({apis: ['setTimeout']})
    let catalogues = 0
    globalThis.fetch = async input => {
        if (String(input).includes('manifest.json')) return Response.json({'models_3d.json': digest})
        catalogues++
        return Response.json({schemaVersion: 1, models: {Pony_Test: model}})
    }
    const selected = await resolveModel('Pony_Test', signal())
    t.mock.timers.tick(60_001)
    assert.deepEqual(selected, model)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), model)
    assert.equal(catalogues, 2)
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
    const animation = { ...model.animations[0], path: `models/3d/anim/${ref.sha256}/move.glb` }
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
        assert.deepEqual(Buffer.from(await fetchBytes(resource, signal())), bytes)
    }
    assert.equal(fetched.filter(path => path.endsWith('.glb')).length, 3)
})

test('animation directory validates digest and native name without changing model or wardrobe paths', async () => {
    const animation = {...model.animations[0], path: `models/3d/anim/${digest}/move.glb`}
    const selected = {...model, wardrobe: {...ref}, animations: [animation]}
    const catalogue = {schemaVersion: 4, models: {Pony_Test: selected}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? manifestFor(catalogue) : catalogue)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), selected)
    for (const path of [`models/3d/anim/${'c'.repeat(64)}/move.glb`,
        `models/3d/anim/${digest}/other.glb`, `models/3d/anim/${digest}/../move.glb`,
        `models/3d/anim/${digest}/move%2F.glb`, `models/3d/${digest}/move.glb`]) {
        animation.path = path
        await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
    }
    animation.path = `models/3d/anim/${digest}/move.glb`
    selected.path = animation.path
    await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
    selected.path = model.path
    selected.wardrobe.path = animation.path
    await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
})

test('owner-specific wardrobe filenames validate identity and digest and retain immutable caching', async () => {
    const wardrobe = {...ref, path: `models/3d/Pony_Test_wardrobe_${digest}.glb`}
    const selected = {...model, wardrobe}
    const catalogue = {schemaVersion: 4, models: {Pony_Test: selected}}
    globalThis.fetch = async (input, options) => {
        const path = new URL(String(input)).pathname.slice(1)
        if (path === 'manifest.json') return Response.json(manifestFor(catalogue))
        if (path === 'models_3d.json') return Response.json(catalogue)
        assert.equal(path, wardrobe.path)
        assert.equal(options.cache, 'default')
        return new Response(bytes)
    }
    const resolved = await resolveModel('Pony_Test', signal())
    assert.deepEqual(resolved, selected)
    assert.deepEqual(Buffer.from(await fetchBytes(resolved!.wardrobe!, signal())), bytes)
    for (const path of [`models/3d/Pony_Other_wardrobe_${digest}.glb`,
        `models/3d/Pony_Test_wardrobe_${'c'.repeat(64)}.glb`,
        `models/3d/../Pony_Test_wardrobe_${digest}.glb`,
        `models/3d/Pony_Test%2F_wardrobe_${digest}.glb`]) {
        wardrobe.path = path
        await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
    }
})

test('wardrobe filenames cannot substitute for ordinary models, animations or additional actors', async () => {
    const wardrobe = {...ref, path: `models/3d/Pony_Test_wardrobe_${digest}.glb`}
    const selected = {...model, animations: [{...model.animations[0]}]}
    const catalogue = {schemaVersion: 4, models: {Pony_Test: selected}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? manifestFor(catalogue) : catalogue)
    selected.path = wardrobe.path
    await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
    selected.path = model.path
    selected.animations[0].path = wardrobe.path
    await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
    selected.animations[0].path = model.animations[0].path
    Object.assign(selected, {additionalActor: {model: {...model, path: wardrobe.path}, parentRoot: 0,
        controller: 'native-first-then-random-v1', transform: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]}})
    await assert.rejects(resolveModel('Pony_Test', signal()), /resource path/)
})

test('catalogue v3 explicitly enables only exported native click and dizzy identities', async () => {
    const interactions = {version: 1, clickAnimations: ['move'], dizzyAnimation: 'move'}
    let catalogue: any = {schemaVersion: 3, models: {Pony_Test: {...model, interactions}}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? manifestFor(catalogue) : catalogue)
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
    const animation = {...model.animations[0], eventBinding: {version: 2, events: [], visibility: [
        {meshName: 'umbrella', times: [0], values: [true]},
    ]}}
    const selected = {...model, animations: [animation], interactions, preferredAnimations: ['move']}
    const catalogue: any = {schemaVersion: 4, models: {Pony_Test: selected}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? manifestFor(catalogue) : catalogue)
    assert.deepEqual(await resolveModel('Pony_Test', signal()), selected)
    catalogue.schemaVersion = 3
    await assert.rejects(resolveModel('Pony_Test', signal()), /version 4/)
    catalogue.schemaVersion = 4
    catalogue.models.Pony_Test = {...selected, preferredAnimations: ['absent']}
    await assert.rejects(resolveModel('Pony_Test', signal()), /preferred animation/)
    catalogue.models.Pony_Test = {...selected, preferredAnimations: ['move', 'move']}
    await assert.rejects(resolveModel('Pony_Test', signal()), /preferred animation/)
    catalogue.models.Pony_Test = {...selected, animations: [{...animation, eventBinding: {version: 1, events: []}}]}
    await assert.rejects(resolveModel('Pony_Test', signal()), /event binding/)
    catalogue.models.Pony_Test = {...selected}
    delete catalogue.models.Pony_Test.interactions
    await assert.rejects(resolveModel('Pony_Test', signal()), /require the native controller/)
})


test('schema 4 expands compact refs with bindings and shares table objects with additional actors', async () => {
    const base = model.animations[0]
    const other = {...base, id: 'other', name: 'Other'}
    const binding = {version: 2, events: [], visibility: [{meshName: 'umbrella', times: [0], values: [true]}]}
    const catalogue = {schemaVersion: 4, animationAssets: [base, {...other, eventBinding: binding}], models: {Pony_Test: {
        ...model, interactions: {version: 1, clickAnimations: ['other']},
        animations: [0, 1], preferredAnimations: ['move'],
        additionalActor: {model: {...ref, animations: [0]}, parentRoot: 0,
            controller: 'native-first-then-random-v1', transform: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]},
    }}}
    globalThis.fetch = async input => Response.json(String(input).includes('manifest.json')
        ? manifestFor(catalogue) : catalogue)
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
        ? manifestFor(catalogue) : catalogue)
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
    catalogue = {schemaVersion: 4, animationAssets: [{...model.animations[0], eventBinding: {version: 1, events: []}}],
        models: {Pony_Test: {...model, animations: [0]}}}
    await assert.rejects(resolveModel('Pony_Test', signal()), /event binding/)
    catalogue = {schemaVersion: 4, animationAssets: [{...model.animations[0], rigKey: 'c'.repeat(64)}],
        models: {Pony_Test: {...model, animations: [0]}}}
    await assert.rejects(resolveModel('Pony_Test', signal()), /rig is incompatible/)
})

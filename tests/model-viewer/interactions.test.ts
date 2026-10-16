import test from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { nativeEvents, nativeEventPlayback, nativeGestures, prepareNativeEyes } from '../../src/components/model-viewer/interactions'
import { disposeGLTF } from '../../src/components/model-viewer/assets'

function fixture() {
    const scene = new Group()
    const meshes = Array.from({length: 4}, () => new Mesh(new BoxGeometry(), new MeshBasicMaterial()))
    scene.add(meshes[0], meshes[1])
    const json: any = {
        nodes: meshes.map((_, i) => ({extras: {atpNativeMeshIndex: i + 10, atpDefaultVisible: i < 2}})),
        scenes: [{nodes: [0, 1]}],
        extras: {atpInteractions: {version: 1, hiddenNodes: [2, 3], eyes: {Open: [11], Closed: [12], Happy: [13], Frown: [11]}}},
    }
    const model = {scene, scenes: [scene], parser: {json,
        associations: new Map(meshes.map((mesh, i) => [mesh, {nodes: i}])),
        getDependency: async (_: string, index: number) => meshes[index],
    }} as unknown as GLTF
    return {model, json, meshes}
}

const pointer = (x: number, props: Partial<PointerEvent> = {}) => ({type: 'pointerup', pointerId: 1, pointerType: 'mouse',
    clientX: x, clientY: 0, pageX: x, button: 0, ctrlKey: false, metaKey: false, shiftKey: false, ...props}) as PointerEvent

test('orphan eyes join the main scene hidden; defaults and native timing survive EyeSet and Reset', async () => {
    const f = fixture(), random = Math.random
    Math.random = () => 0
    try {
        const eyes = (await prepareNativeEyes(f.model, new AbortController().signal))!
        assert.equal(f.model.scene.children.length, 4)
        assert.deepEqual(eyes.snapshot().visible, [10, 11])
        eyes.update(0) // first native tick opens and schedules 2 seconds
        assert.equal(eyes.snapshot().remaining, 2)
        eyes.update(2)
        assert.deepEqual(eyes.snapshot().visible, [10, 11], 'zero crossing switches on the next update')
        eyes.update(0)
        assert.deepEqual(eyes.snapshot().visible, [10, 12])
        eyes.set({frame: 0, type: 'EyeSet', state: 'Happy', enableBlink: false})
        const phase = eyes.snapshot().remaining
        eyes.update(10)
        assert.deepEqual(eyes.snapshot().visible, [10, 13])
        assert.equal(eyes.snapshot().remaining, phase)
        eyes.reset()
        assert.deepEqual(eyes.snapshot().visible, [10, 11])
        assert.equal(eyes.snapshot().remaining, phase, 'native reset restores expression without restarting timer')
        eyes.set({frame: 0, type: 'EyeSet', state: 'None', enableBlink: false})
        assert.deepEqual(eyes.snapshot().visible, [10])
    } finally { Math.random = random; disposeGLTF(f.model) }
})

test('four signed modulo rotations strictly over 220 degrees trigger dizzy, including release displacement', () => {
    const gestures = nativeGestures()
    for (const angle of [220, 360, 380, -220]) {
        gestures.down(pointer(0), true)
        assert.equal(gestures.up(pointer(angle), 360, 1, true), undefined)
        assert.equal(gestures.spins, 0)
    }
    for (let i = 0; i < 4; i++) {
        gestures.down(pointer(0), true)
        gestures.move(pointer(210), 360, 1)
        assert.equal(gestures.up(pointer(230), 360, 1, true), i === 3 ? 'dizzy' : undefined)
    }
    assert.equal(gestures.spins, 0)
})

test('drag-return, cancellation, two fingers and modifier buttons cannot become taps or spins', () => {
    const gestures = nativeGestures()
    gestures.down(pointer(0), true)
    gestures.move(pointer(20), 360, 1)
    assert.equal(gestures.up(pointer(0), 360, 1, true), undefined)
    for (const props of [{button: 2}, {ctrlKey: true}, {metaKey: true}, {shiftKey: true}]) {
        gestures.down(pointer(0, props), true)
        assert.equal(gestures.up(pointer(0, props), 360, 1, true), undefined)
    }
    gestures.down(pointer(0), true)
    assert.equal(gestures.up(pointer(230, {type: 'pointercancel'}), 360, 1, true), undefined)
    gestures.down(pointer(0, {pointerType: 'touch'}), true)
    gestures.down(pointer(0, {pointerType: 'touch', pointerId: 2}), true)
    assert.equal(gestures.up(pointer(230), 360, 1, true), undefined)
    assert.equal(gestures.up(pointer(230, {pointerId: 2}), 360, 1, true), undefined)
    assert.equal(gestures.spins, 0)
    gestures.down(pointer(0), true)
    assert.equal(gestures.up(pointer(4), 360, 1, true), 'click')
    gestures.down(pointer(0), true)
    gestures.clear()
    assert.equal(gestures.up(pointer(0), 360, 1, true), undefined)
})


test('hidden SubObject nodes are supported without an eye controller', async () => {
    const f = fixture()
    delete f.json.extras.atpInteractions.eyes
    f.json.extras.atpInteractions.subObjects = [12, 13]
    const controller = (await prepareNativeEyes(f.model, new AbortController().signal))!
    assert.equal(controller.active, false)
    assert.equal(f.model.scene.children.length, 4)
    assert.deepEqual(controller.snapshot().visible, [10, 11])
    disposeGLTF(f.model)
})

test('event playback delivers crossed emitters once and reconstructs after seek or loop', () => {
    const calls: unknown[] = []
    const player = nativeEventPlayback([
        {frame: 0, type: 'Emitter', effect: 'stars'},
        {frame: 2, type: 'EyeSet', state: 'Closed', enableBlink: false},
    ], 2, {reset: () => calls.push('reset'), apply: (event, age) => calls.push([event.type, age])})
    player.update(0)
    player.update(.25)
    player.update(1.5)
    assert.deepEqual(calls, [['Emitter', 0], ['EyeSet', .5]])
    calls.length = 0
    player.update(.5)
    assert.deepEqual(calls, ['reset', ['Emitter', .5]])
    calls.length = 0
    player.update(.5, 1)
    assert.deepEqual(calls, ['reset', ['Emitter', .5]])
})

test('SubObject rejects invalid indices, unresolved actual nodes and unsupported event fields', async () => {
    const f = fixture()
    f.json.extras.atpInteractions.subObjects = [10]
    await prepareNativeEyes(f.model, new AbortController().signal)
    for (const event of [
        {frame: 0, type: 'SubObject', meshes: [999], visible: true},
        {frame: 0, type: 'SubObject', meshes: [10, 10], visible: true},
        {frame: 0, type: 'SubObject', meshes: [], visible: true},
        {frame: 0, type: 'SubObject', meshes: [10], visible: 1},
        {frame: 0, type: 'SubObject', meshes: [10], visible: true, extra: 1},
    ]) assert.throws(() => nativeEvents(f.model, {frameCount: 4, eventProfile: 'ponybook-v1', events: [event]}, true))
    f.model.scene.remove(f.meshes[0])
    assert.throws(() => nativeEvents(f.model, {frameCount: 4, eventProfile: 'ponybook-v1', events: [
        {frame: 0, type: 'SubObject', meshes: [10], visible: true},
    ]}, true), /SubObject/)
    f.model.scene.add(f.meshes[0])
    disposeGLTF(f.model)
})


test('exact native frame seeks do not lose an event through floating point floor', () => {
    const applied: unknown[] = []
    const player = nativeEventPlayback([{frame: 123, type: 'EyeSet', state: 'Closed', enableBlink: false}], 30,
        {reset() {}, apply: event => applied.push(event)})
    player.update(122.999 / 30)
    assert.equal(applied.length, 0)
    player.update(123 / 30)
    assert.equal(applied.length, 1)
})

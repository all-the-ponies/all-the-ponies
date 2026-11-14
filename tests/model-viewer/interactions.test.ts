import test from 'node:test'
import assert from 'node:assert/strict'
import { Bone, BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, OrthographicCamera, Skeleton, SkinnedMesh, Uint16BufferAttribute, Vector3 } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { hitsModel, nativeEvents, nativeEventPlayback, nativeGestures, prepareNativeEyes } from '../../src/components/model-viewer/interactions'
import { disposeGLTF } from '../../src/components/model-viewer/assets'

function fixture() {
    const scene = new Group()
    const meshes = Array.from({length: 4}, () => new Mesh(new BoxGeometry(), new MeshBasicMaterial()))
    scene.add(meshes[0], meshes[1])
    const json: any = {
        nodes: meshes.map((_, i) => ({extras: {atpNativeMeshIndex: i + 10, atpDefaultVisible: i < 2}})),
        scenes: [{nodes: [0, 1]}],
        extras: {atpInteractions: {version: 1, blink: true, hiddenNodes: [2, 3], eyes: {Open: [11], Closed: [12], Happy: [13], Frown: [11]}}},
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
    delete f.json.extras.atpInteractions.blink
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

test('the callback stream rejects legacy SubObject records', async () => {
    const f = fixture()
    await prepareNativeEyes(f.model, new AbortController().signal)
    assert.throws(() => nativeEvents(f.model, [
        {frame: 0, type: 'SubObject', meshes: [10], visible: true},
    ] as any, 4, true), /Unsupported native animation event/)
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


test('a proven empty Closed target still blinks, hides expressions and restores state without restarting time', async () => {
    const f = fixture(), random = Math.random
    f.json.extras.atpInteractions.eyes.Closed = []
    f.json.extras.atpInteractions.hiddenNodes = [3]
    Math.random = () => 0
    try {
        const eyes = (await prepareNativeEyes(f.model, new AbortController().signal))!
        assert.equal(eyes.active, true)
        assert.equal(f.model.scene.children.includes(f.meshes[2]!), false)
        eyes.update(0); eyes.update(2); eyes.update(0)
        assert.deepEqual(eyes.snapshot().visible, [10], 'closing hides Open even without Closed triangles')
        const closedPhase = eyes.snapshot()
        eyes.set({frame: 0, type: 'EyeSet', state: 'Happy', enableBlink: false})
        eyes.update(5)
        assert.deepEqual(eyes.snapshot().visible, [10, 13])
        assert.equal(eyes.snapshot().remaining, closedPhase.remaining)
        eyes.set({frame: 0, type: 'EyeSet', state: 'Closed', enableBlink: true})
        assert.deepEqual(eyes.snapshot().visible, [10], 'an empty state still hides other expressions')
        eyes.resetPlayback()
        assert.equal(eyes.snapshot().remaining, closedPhase.remaining)
        assert.equal(eyes.snapshot().open, closedPhase.open)
        assert.deepEqual(eyes.snapshot().visible, [10, 11])
        eyes.set({frame: 0, type: 'EyeSet', state: 'Happy', enableBlink: true})
        eyes.update(.1); eyes.update(0)
        assert.deepEqual(eyes.snapshot().visible, [10, 13], 'reopening restores the current expression')
        eyes.reset()
        assert.deepEqual(eyes.snapshot().visible, [10, 11])
    } finally { Math.random = random; disposeGLTF(f.model) }
})

test('all pruned eye targets preserve controller timing while an unapproved controller stays disabled', async () => {
    const f = fixture()
    f.meshes[1]!.removeFromParent()
    const profile = f.json.extras.atpInteractions
    profile.eyes = {Open: [], Closed: [], Happy: [], Frown: []}
    profile.hiddenNodes = []
    const eyes = (await prepareNativeEyes(f.model, new AbortController().signal))!
    assert.equal(eyes.active, true)
    eyes.update(0)
    assert.ok(eyes.snapshot().remaining >= 2)
    eyes.set({frame: 0, type: 'EyeSet', state: 'Closed', enableBlink: false})
    assert.deepEqual(eyes.snapshot().visible, [10])
    assert.equal(eyes.active, false)
    eyes.resetPlayback()
    assert.equal(eyes.active, true)
    disposeGLTF(f.model)
    const disabled = fixture()
    disabled.json.extras.atpInteractions.blink = false
    const staticEyes = (await prepareNativeEyes(disabled.model, new AbortController().signal))!
    assert.equal(staticEyes.active, false, 'renderable geometry must not invent source blink capability')
    disposeGLTF(disabled.model)
})

test('explicit blink capability never authorizes an invalid rendered target', async () => {
    const f = fixture()
    f.json.extras.atpInteractions.eyes.Closed = [99]
    await assert.rejects(prepareNativeEyes(f.model, new AbortController().signal), /Invalid eye mesh reference/)
    disposeGLTF(f.model)
})


for (const indexed of [true, false]) {
    test(`hit testing follows the current pose using only referenced ${indexed ? 'indexed' : 'non-indexed'} vertices`, t => {
        const geometry = new BufferGeometry()
        const count = indexed ? 259 : 3
        const positions = new Float32Array(count * 3).fill(100)
        positions.set([-1, -1, 0, 1, -1, 0, 0, 1, 0])
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
        geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4))
        const weights = new Float32BufferAttribute(new Float32Array(count * 4), 4)
        for (let i = 0; i < count; i++) weights.setX(i, 1)
        geometry.setAttribute('skinWeight', weights)
        if (indexed) geometry.setIndex([0, 1, 2])
        const mesh = new SkinnedMesh(geometry, new MeshBasicMaterial())
        const bone = new Bone()
        mesh.add(bone)
        mesh.bind(new Skeleton([bone]))
        const scene = new Group()
        scene.add(mesh)
        const model = {scene} as unknown as GLTF
        const camera = new OrthographicCamera(-3, 3, 3, -3, .1, 100)
        camera.position.z = 10
        const canvas = {getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100})} as HTMLCanvasElement
        const visited = new Set<number>()
        const vertexPosition = mesh.getVertexPosition.bind(mesh)
        t.mock.method(mesh, 'getVertexPosition', (index: number, target: Vector3) => {
            visited.add(index)
            return vertexPosition(index, target)
        })
        try {
            assert.equal(hitsModel(model, camera, canvas, {clientX: 50, clientY: 50}), true)
            assert.deepEqual([...visited].sort((a, b) => a - b), [0, 1, 2], 'unused wardrobe vertices must not be skinned')
            bone.position.x = 2
            assert.equal(hitsModel(model, camera, canvas, {clientX: 50, clientY: 50}), false)
            assert.equal(hitsModel(model, camera, canvas, {clientX: 80, clientY: 50}), true)
            mesh.visible = false
            visited.clear()
            assert.equal(hitsModel(model, camera, canvas, {clientX: 80, clientY: 50}), false)
            assert.equal(visited.size, 0, 'hidden meshes must not be skinned')
            mesh.visible = true
            bone.position.x = 0
            assert.equal(hitsModel(model, camera, canvas, {clientX: 50, clientY: 50}), true)
        } finally {
            geometry.dispose()
            mesh.material.dispose()
            mesh.skeleton.dispose()
        }
    })
}

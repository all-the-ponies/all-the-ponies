import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as THREE from 'three'
import { bindAnimation as bindNativeAnimation } from '../../src/components/model-viewer/animation'
import { nativeEventPlayback, nativeGestures, prepareNativeEyes as prepareEyes } from '../../src/components/model-viewer/interactions'

// Execute the actual runtime and attachment bodies with real Three.js math and
// AnimationMixer. Only browser, asset I/O and metadata boundaries are replaced;
// this is a lifecycle test, not a WebGL or native-format validation test.
function sourceModule(filename: string, imports: Record<string, unknown>) {
    const url = new URL(`../../src/components/model-viewer/${filename}`, import.meta.url)
    const source = ts.createSourceFile(filename, readFileSync(url, 'utf8'), ts.ScriptTarget.ES2022, true)
    const body = ts.factory.updateSourceFile(source, source.statements.filter(statement => !ts.isImportDeclaration(statement)))
    const code = ts.transpileModule(ts.createPrinter().printFile(body), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const exports: Record<string, any> = {}
    runInNewContext(code, { exports, AbortController, console, Math, ...imports }, { filename })
    return exports
}

function model(name: string) {
    const scene = new THREE.Group()
    const bone = new THREE.Bone()
    bone.name = `${name}-root`
    scene.add(bone, new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()))
    return { name, scene, bone, scenes: [scene], animations: [] }
}

function fixture(mode: 'normal' | 'pending-child' | 'eventful' | 'pending-effects' | 'visibility' | 'overlap' = 'normal') {
    const parent = model('parent')
    const child = model('child')
    const prop = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    prop.visible = false
    parent.scene.add(prop)
    let nativeSource: any
    if (mode === 'overlap') {
        const body = parent.scene.children.find(object => object instanceof THREE.Mesh)!
        const rig = {version: 1, key: 'a'.repeat(64), parents: [-1], jointNodes: [1], coordinateSystem: 'native-Y-down-to-glTF-Y-up-RxPi'}
        const json = {nodes: [{children: [1, 2]}, {}, {extras: {atpNativeMeshIndex: 0, atpDefaultVisible: true}},
            {extras: {atpNativeMeshIndex: 1, atpDefaultVisible: false}}], scenes: [{nodes: [0]}],
            extras: {atpRig: rig, atpInteractions: {version: 1, hiddenNodes: [3], subObjects: [0, 1], eyes: {Open: [0], Closed: [1]}, effects: {stars: {}}}}}
        Object.assign(parent, {parser: {json, associations: new Map<THREE.Object3D, {nodes: number}>([[parent.scene, {nodes: 0}], [parent.bone, {nodes: 1}], [body, {nodes: 2}], [prop, {nodes: 3}]]),
            getDependency: async (_: string, index: number) => [parent.scene, parent.bone, body, prop][index]}})
        const bone = new THREE.Bone(); bone.name = 'source_root'
        const sourceScene = new THREE.Group(); sourceScene.add(bone)
        const times = Array.from({length: 31}, (_, i) => i / 30)
        const tracks = [new THREE.VectorKeyframeTrack('source_root.position', times, times.flatMap(() => [0, 0, 0]), THREE.InterpolateDiscrete),
            new THREE.QuaternionKeyframeTrack('source_root.quaternion', times, times.flatMap(() => [0, 0, 0, 1]), THREE.InterpolateDiscrete)]
        nativeSource = {name: 'native-source', scene: sourceScene, animations: [new THREE.AnimationClip('overlap', 1, tracks)], parser: {
            json: {nodes: [{children: [1]}, {}], accessors: [{count: 31}, {count: 31}],
                extras: {atpRig: rig, atpClip: {frameCount: 30, fps: 30, duration: 1}},
                animations: [{channels: ['translation', 'rotation'].map(path => ({sampler: 0, target: {node: 1, path}})), samplers: [{input: 0, output: 1, interpolation: 'STEP'}]}]},
            associations: new Map([[bone, {nodes: 1}]]), getDependency: async () => bone,
        }}
    }
    parent.bone.position.set(1, 4, 2)
    const disposed: string[] = []
    const frames = new Map<number, FrameRequestCallback>()
    const listeners = new Map<string, () => void>()
    const changes: any[] = []
    const renders: { parent: number[], childMatrix?: number[] }[] = []
    let frameId = 0
    let childRequested = false
    let childAborted = false
    const eventLog: any[] = []
    let effectRequested = false, effectsDisposed = 0, effectAge = -1
    let completeEffects!: () => void
    let expression = 'Open'
    const effectController = {
        get active() { return effectAge >= 0 && effectAge < 2 },
        trigger(name: string, elapsed: number) { eventLog.push({name, elapsed}); effectAge = 0 },
        update(delta: number) { if (effectAge >= 0) effectAge += delta },
        render() {}, reset() { effectAge = -1 }, dispose() { effectsDisposed++ }, snapshot() { return {effectAge} },
    }
    const document = {
        hidden: false,
        addEventListener(name: string, listener: () => void) { listeners.set(name, listener) },
        removeEventListener(name: string) { listeners.delete(name) },
    }
    const canvas = { tabIndex: 0, addEventListener() {}, removeEventListener() {}, remove() {} }
    class Renderer {
        domElement = canvas
        setPixelRatio() {}
        setSize() {}
        render() {
            renders.push({ parent: parent.bone.position.toArray(), childMatrix: child.scene.parent?.matrix.toArray() })
        }
        dispose() {}
        forceContextLoss() {}
    }
    class Controls extends THREE.EventDispatcher {
        target = new THREE.Vector3()
        touches = {}
        constructor(private camera: THREE.PerspectiveCamera) { super() }
        update() {}
        dispose() {}
        getPolarAngle() { return 1 }
        getAzimuthalAngle() { return 0 }
        getDistance() { return this.camera.position.distanceTo(this.target) }
    }
    const animation = { id: 'move', name: 'Move', duration: 1, sha256: 'parent-animation' }
    if (mode === 'overlap') Object.assign(animation, {rigKey: 'a'.repeat(64), eventBinding: {version: 1, events: [
        {frame: 0, type: 'EyeSet', state: 'Closed', enableBlink: true},
        {frame: 0, type: 'SubObject', meshes: [0, 1], visible: true},
        {frame: 0, type: 'Emitter', effect: 'stars'},
        {frame: 3, type: 'Emitter', effect: 'stars'},
        {frame: 15, type: 'SubObject', meshes: [0, 1], visible: true},
    ]}})
    const secondAnimation = {...animation, id: 'other', name: 'Other'}
    const childAnimation = { id: 'idle', name: 'Idle', duration: 1, sha256: 'child-animation' }
    const childRef = { rigKey: 'child-rig', animations: [childAnimation] }
    const ref = {
        rigKey: 'parent-rig', animations: [animation, secondAnimation],
        additionalActor: {
            model: childRef, parentRoot: 0, controller: 'native-first-then-random-v1',
            transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 0, 0, 1],
        },
    }
    async function loadGLB(asset: unknown, signal: AbortSignal) {
        signal.throwIfAborted()
        if (asset === ref) return parent
        if (asset === childRef) {
            childRequested = true
            if (mode === 'pending-child') {
                return await new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
                    childAborted = true
                    reject(signal.reason)
                }, { once: true }))
            }
            return child
        }
        return { name: asset === animation ? 'parent-animation' : 'child-animation' }
    }
    const injected = {
        THREE: { ...THREE, WebGLRenderer: Renderer },
        loadGLB,
        disposeGLTF(value: { name: string }) { disposed.push(value.name) },
        rigMetadata(value: unknown) { return { key: value === parent ? ref.rigKey : childRef.rigKey, jointNodes: [1] } },
        jointObjects(value: typeof parent) { return new Map([[1, value.bone]]) },
        checkAdditionalActor() {},
        applyNativeDepth() {},
        nativeUVClock() { return { active: false, update() {}, snapshot() { return undefined } } },
        nativeEventPlayback, nativeGestures,
        async prepareNativeEyes() {
            if (mode === 'overlap') return prepareEyes(parent as any, new AbortController().signal)
            if (mode === 'visibility') return {
                active: false, update() {}, useVisibility() {}, resetPlayback() {},
                set() { throw new Error('SubObject must be played only by its track') },
                reset() { prop.visible = false }, snapshot() { return {propVisible: prop.visible} },
            }
            return mode !== 'eventful' ? undefined : {
            active: true, update() {}, useVisibility() {}, resetPlayback() { expression = 'Open' }, set(event: any) { expression = event.state; eventLog.push(event) },
            reset() { expression = 'Open' }, snapshot() { return {expression} },
        } },
        async createNativeEmitters() {
            effectRequested = true
            if (mode === 'pending-effects') await new Promise<void>(resolve => { completeEffects = resolve })
            return effectController
        },
        async bindAnimation(value: typeof parent, _source: unknown, selected: typeof animation) {
            if (mode === 'overlap' && value === parent) return bindNativeAnimation(parent as any, nativeSource, selected as any, true)
            const track = new THREE.VectorKeyframeTrack(`${value.bone.uuid}.position`, [0, 1],
                value === parent ? [3, 9, 5, 3, 9, 5] : [0, 0, 0, 1, 0, 0], THREE.InterpolateLinear)
            const tracks: THREE.KeyframeTrack[] = [track]
            if (mode === 'visibility' && value === parent) tracks.push(new THREE.BooleanKeyframeTrack(`${prop.uuid}.visible`, [0, .5], [selected.id === 'move', selected.id !== 'move']))
            return Object.assign(new THREE.AnimationClip(value === parent ? 'Move' : 'Idle', 1, tracks), {
                nativeFPS: 30, nativeEvents: mode !== 'eventful' || value !== parent ? [] : [
                    {frame: 0, type: 'EyeSet', state: 'Happy', enableBlink: false},
                    {frame: 1, type: 'EyeSet', state: 'Frown', enableBlink: false},
                    {frame: 2, type: 'Emitter', effect: 'stars'},
                ],
            })
        },
    }
    const additional = sourceModule('additional.ts', injected)
    const runtime = sourceModule('runtime.ts', {
        ...injected, ...additional, OrbitControls: Controls, document, devicePixelRatio: 1,
        ResizeObserver: class { observe() {} disconnect() {} },
        requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++frameId, callback); return frameId },
        cancelAnimationFrame(id: number) { frames.delete(id) },
    })
    const viewer = runtime.mountViewer({ clientWidth: 400, clientHeight: 300, appendChild() {} }, ref,
        (state: unknown) => changes.push(state))
    return {
        viewer, parent, child, animation, secondAnimation, prop, disposed, frames, changes, renders, listeners,
        childRequested: () => childRequested,
        childAborted: () => childAborted,
        eventLog, effectRequested: () => effectRequested, effectsDisposed: () => effectsDisposed,
        completeEffects: () => completeEffects(),
        tick(time: number) {
            assert.equal(frames.size, 1, 'the viewer must own exactly one animation frame')
            const [id, callback] = frames.entries().next().value!
            frames.delete(id)
            callback(time)
        },
        hidden(value: boolean) { document.hidden = value; listeners.get('visibilitychange')!() },
        close() {
            viewer.dispose()
            for (const value of [parent, child]) value.scene.traverse(object => {
                if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose() }
            })
        },
    }
}

test('parent frame zero moves the additional actor before the first render, following only root X/Z', async () => {
    const f = fixture()
    try {
        await f.viewer.ready
        assert.equal(f.viewer.snapshot().ready, true)
        assert.equal(f.viewer.snapshot().additional.matrix[12], 10)
        await f.viewer.play(f.animation)
        assert.deepEqual(f.parent.bone.position.toArray(), [3, 9, 5])
        // Rest root [1,4,2] -> frame zero [3,9,5], so the child's translation
        // changes by [2,0,3] immediately, without waiting for the next RAF.
        assert.deepEqual(f.renders.at(-1)!.childMatrix!.slice(12, 15), [12, 0, 3])
        f.tick(100)
        assert.deepEqual(f.renders.at(-1)!.childMatrix!.slice(12, 15), [12, 0, 3])
    } finally { f.close() }
    assert.equal(f.frames.size, 0)
})

test('disposing during a child model request aborts it and releases the parent exactly once', async () => {
    const f = fixture('pending-child')
    try {
        for (let attempts = 0; attempts < 100 && !f.childRequested(); attempts++) await Promise.resolve()
        assert.equal(f.childRequested(), true, 'the asynchronous child request must have started')
        f.viewer.dispose()
        await f.viewer.ready
        assert.equal(f.childAborted(), true)
        assert.equal(f.disposed.filter(name => name === 'parent').length, 1)
        assert.equal(f.changes.some(state => state.ready), false)
        assert.equal(f.frames.size, 0)
        assert.equal(f.listeners.size, 0)
    } finally { f.close() }
    assert.equal(f.disposed.filter(name => name === 'parent').length, 1)
})

test('runtime dispatches frame zero and all crossed events, restoring eyes but preserving the finite effect tail', async () => {
    const f = fixture('eventful')
    try {
        await f.viewer.ready
        await f.viewer.play(f.animation)
        assert.equal(f.viewer.snapshot().eyes.expression, 'Happy')
        f.tick(0)
        f.tick(100)
        assert.equal(f.viewer.snapshot().eyes.expression, 'Frown')
        assert.equal(f.eventLog.length, 3)
        assert.equal(f.eventLog[2].name, 'stars')
        assert.ok(Math.abs(f.eventLog[2].elapsed - 1 / 30) < 1e-12)
        f.hidden(true)
        const age = f.viewer.snapshot().effects.effectAge
        f.hidden(false); f.tick(5000)
        assert.equal(f.viewer.snapshot().effects.effectAge, age)
        for (let i = 1; i <= 11; i++) f.tick(5000 + i * 100)
        assert.equal(f.viewer.snapshot().playing, false)
        assert.equal(f.viewer.snapshot().atRest, true)
        assert.equal(f.viewer.snapshot().eyes.expression, 'Open')
        assert.ok(f.viewer.snapshot().effects.effectAge >= 0, 'natural completion must not discard active particles')
        f.viewer.reset()
        assert.equal(f.viewer.snapshot().effects.effectAge, -1)
        assert.equal(f.eventLog.length, 3, 'completed events must not replay on reset')
    } finally { f.close() }
    assert.equal(f.effectsDisposed(), 1)
})

test('disposing during effect dependency preparation releases the late result without reviving the viewer', async () => {
    const f = fixture('pending-effects')
    try {
        for (let attempts = 0; attempts < 100 && !f.effectRequested(); attempts++) await Promise.resolve()
        assert.equal(f.effectRequested(), true)
        f.viewer.dispose()
        assert.equal(f.disposed.filter(name => name === 'parent').length, 0, 'pending preparation retains ownership until its dependency finishes')
        f.completeEffects()
        await f.viewer.ready
        assert.equal(f.effectsDisposed(), 1)
        assert.equal(f.disposed.filter(name => name === 'parent').length, 1)
        assert.equal(f.changes.some(state => state.ready), false)
        assert.equal(f.frames.size, 0)
    } finally { f.close() }
})


test('runtime restores props on restart, reset, switch and idle with distinct bindings for the same skeletal SHA', async () => {
    const f = fixture('visibility')
    try {
        await f.viewer.ready
        assert.equal(f.prop.visible, false)
        await f.viewer.play(f.animation)
        assert.equal(f.prop.visible, true)
        await f.viewer.play(f.animation)
        assert.equal(f.prop.visible, true, 'restart must replay frame zero after restoring defaults')
        assert.equal(f.animation.sha256, f.secondAnimation.sha256)
        await f.viewer.play(f.secondAnimation)
        assert.equal(f.prop.visible, false, 'same skeletal bytes must not reuse a different per-model event binding')
        assert.equal(f.viewer.snapshot().cachedAnimations, 2)
        await f.viewer.play(f.animation)
        assert.equal(f.prop.visible, true)
        f.viewer.reset()
        assert.equal(f.prop.visible, false)
        await f.viewer.play(f.animation)
        f.tick(0)
        for (let i = 1; i <= 11; i++) f.tick(i * 100)
        assert.equal(f.viewer.snapshot().playing, false)
        assert.equal(f.prop.visible, false, 'natural completion must restore default visibility')
    } finally { f.close() }
})


test('controller seeks, loops and replays, including after natural completion', async () => {
    const f = fixture('visibility')
    try {
        await f.viewer.ready
        await f.viewer.play(f.animation)
        assert.equal(typeof f.viewer.seek, 'function')
        assert.equal(typeof f.viewer.setLoop, 'function')
        assert.equal(typeof f.viewer.replay, 'function')
        f.viewer.seek(.75)
        assert.equal(f.prop.visible, false)
        f.viewer.seek(0)
        assert.equal(f.prop.visible, true)
        f.viewer.setLoop(true)
        f.tick(0)
        for (let i = 1; i <= 23; i++) f.tick(i * 100)
        assert.equal(f.viewer.snapshot().playing, true)
        assert.ok(f.viewer.snapshot().cycle >= 2)
        f.viewer.seek(0)
        assert.equal(f.prop.visible, true)
        f.viewer.setLoop(false)
        for (let i = 24; i <= 35; i++) f.tick(i * 100)
        assert.equal(f.viewer.snapshot().playing, false)
        assert.equal(f.prop.visible, false)
        f.viewer.seek(.25)
        assert.equal(f.viewer.snapshot().playing, true, 'seek must re-enable a finished LoopOnce action')
        assert.equal(f.prop.visible, true)
        f.viewer.seek(1)
        assert.equal(f.viewer.snapshot().playing, false)
        await f.viewer.replay()
        assert.equal(f.viewer.snapshot().playing, true)
        assert.equal(f.prop.visible, true)
        assert.throws(() => f.viewer.seek(NaN), /time/)
        assert.throws(() => f.viewer.seek(-1), /time/)
    } finally { f.close() }
})


test('actual runtime composes overlapping eye tracks, blinking, seeks and loop restoration', async () => {
    const f = fixture('overlap')
    const body = f.parent.scene.children.find(object => object instanceof THREE.Mesh && object !== f.prop)!
    try {
        await f.viewer.ready
        await f.viewer.play(f.animation)
        assert.equal(f.viewer.snapshot().error, '')
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
        f.tick(0) // native first blink tick updates expression via track only
        assert.deepEqual([body.visible, f.prop.visible], [false, true])
        const phase = f.viewer.snapshot().eyes.remaining
        f.viewer.seek(0)
        assert.equal(f.viewer.snapshot().eyes.remaining, phase, 'seek retains native blink timer/phase')
        assert.deepEqual([body.visible, f.prop.visible], [true, true], 'same-time seek clears blink override')
        f.eventLog.length = 0
        f.viewer.seek(.5)
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
        assert.equal(f.eventLog.filter(event => event.name === 'stars').length, 2)
        assert.ok(Math.abs(f.eventLog.at(-1).elapsed - .4) < 1e-12)
        f.viewer.seek(.25)
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
        f.viewer.setLoop(true)
        f.viewer.seek(2.25)
        assert.equal(f.viewer.snapshot().cycle, 2)
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
        f.tick(0)
        for (let i = 1; i <= 9; i++) f.tick(i * 100)
        assert.equal(f.viewer.snapshot().cycle, 3)
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
        f.viewer.reset()
        assert.deepEqual([body.visible, f.prop.visible], [true, false])
        await f.viewer.replay()
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
        f.viewer.setLoop(false)
        f.viewer.seek(1)
        assert.deepEqual([body.visible, f.prop.visible], [true, false])
        const count = f.eventLog.length
        f.viewer.seek(.25)
        assert.equal(f.eventLog.length, count + 2, 'seeking an ended action emits each reconstructed event once')
        assert.deepEqual([body.visible, f.prop.visible], [true, true])
    } finally { f.close() }
})

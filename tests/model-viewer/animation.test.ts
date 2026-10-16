import assert from 'node:assert/strict';
import test from 'node:test';
import { AnimationClip, AnimationMixer, BooleanKeyframeTrack, BoxGeometry, Mesh, MeshBasicMaterial, BufferAttribute, InterpolateDiscrete, LoopOnce, Object3D, Quaternion, QuaternionKeyframeTrack, Scene, Vector3, VectorKeyframeTrack } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { bindAnimation } from '../../src/components/model-viewer/animation';
import { nativeEventPlayback, prepareNativeEyes } from '../../src/components/model-viewer/interactions';
import type { AnimationRef } from '../../src/components/model-viewer/assets';

/** Synthetic GLTFLoader output with real Three.js tracks and mixers. */
function fixture() {
    const rig = {version: 1, key: 'a'.repeat(64), parents: [-1, 0], jointNodes: [1, 2], coordinateSystem: 'native-Y-down-to-glTF-Y-up-RxPi'}
    function make() {
        const scene = new Scene()
        const root = new Object3D()
        const first = new Object3D()
        const second = new Object3D()
        first.name = 'shared_name'
        second.name = 'shared_name_2'
        root.add(first)
        first.add(second)
        scene.add(root)
        const nodes = [root, first, second]
        const associations = new Map(nodes.map((node, index) => [node, {nodes: index}]))
        const json: any = {
            nodes: [{children: [1]}, {children: [2]}, {}],
            extras: {atpRig: structuredClone(rig)},
        }
        const gltf = {scene, scenes: [scene], animations: [], parser: {json, associations, getDependency: async (_: string, index: number) => nodes[index]}} as unknown as GLTF
        return {gltf, nodes, json}
    }
    const model = make()
    const source = make()
    const times = [0, .5, 1]
    source.json.extras.atpClip = {fps: 2, frameCount: 2, duration: 1, events: []}
    source.json.accessors = [{count: 3}, {count: 3}]
    const channels = [1, 2].flatMap(node => ['translation', 'rotation'].map(path => ({sampler: 0, target: {node, path}})))
    source.json.animations = [{channels, samplers: [{input: 0, output: 1, interpolation: 'STEP'}]}]
    source.gltf.animations = [new AnimationClip('motion', 1, [1, 2].flatMap(index => [
        new VectorKeyframeTrack(`${source.nodes[index].name}.position`, times, [0, 0, 0, 1, 0, 0, 1, 0, 0], InterpolateDiscrete),
        new QuaternionKeyframeTrack(`${source.nodes[index].name}.quaternion`, times, [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], InterpolateDiscrete),
    ]))]
    const ref: AnimationRef = {path: `models/3d/${'b'.repeat(64)}.glb`, sha256: 'b'.repeat(64), bytes: 100, id: 'motion', name: 'Motion', rigKey: rig.key, duration: 1}
    return {model, source, ref}
}

function nativeFixture() {
    const f = fixture(), half = Math.SQRT1_2
    const translations = new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0])
    // Unequal packed lengths, and the equivalent negative quaternion at the
    // second root sample: tests normalization order and shortest-path choice.
    const rotations = new Float32Array([0, 0, 0, .8, 0, 0, 0, .9,
        0, 0, -half * .95, -half * .95, 0, 0, 0, .9])
    f.source.json.extras.atpClip.nativeSampling = {version: 1, translations: 2, rotations: 3}
    f.source.json.accessors.push({componentType: 5126, type: 'VEC3', count: 4}, {componentType: 5126, type: 'VEC4', count: 4})
    const attributes = [new BufferAttribute(translations, 3), new BufferAttribute(rotations, 4)]
    const dependency = f.source.gltf.parser.getDependency.bind(f.source.gltf.parser)
    f.source.gltf.parser.getDependency = async (type: string, index: number) => type === 'accessor' ? attributes[index - 2] : dependency(type, index)
    const tracks = f.source.gltf.animations[0].tracks
    tracks[0].values.set([0, 0, 0, 0, 0, 0, 0, 0, 0])
    tracks[1].values.set([0, 0, 0, 1, 0, 0, half, half, 0, 0, half, half])
    tracks[2].values.set([1, 0, 0, 0, -1, 0, 0, -1, 0])
    tracks[3].values.set([0, 0, 0, 1, 0, 0, -half, half, 0, 0, -half, half])
    return {...f, translations, rotations}
}

test('binds each track to destination UUID and preserves STEP sampling', async () => {
    const {model, source, ref} = fixture()
    model.nodes[1].name = model.nodes[2].name = 'duplicate_destination_name'
    const clip = await bindAnimation(model.gltf, source.gltf, ref)
    assert.equal(clip.tracks[0].name, `${model.nodes[1].uuid}.position`)
    assert.equal(clip.tracks[2].name, `${model.nodes[2].uuid}.position`)
    assert.equal(clip.tracks[0].getInterpolation(), InterpolateDiscrete)
    const mixer = new AnimationMixer(model.gltf.scene)
    mixer.clipAction(clip).play()
    mixer.update(.75)
    assert.equal(model.nodes[1].position.x, 1)
    assert.equal(model.nodes[2].position.x, 1)
    mixer.stopAllAction()
    assert.equal(model.nodes[1].position.x, 0)
    mixer.uncacheRoot(model.gltf.scene)
})

test('rejects a different rig even when the bone count is equal', async () => {
    const {model, source, ref} = fixture()
    source.json.extras.atpRig.key = 'c'.repeat(64)
    await assert.rejects(bindAnimation(model.gltf, source.gltf, ref), /rig is incompatible/)
})

test('supported events require an explicit controller and preserve STEP/native sampling contracts', async () => {
    for (const sampling of ['step', 'native']) {
        const {model, source, ref} = sampling === 'native' ? nativeFixture() : fixture()
        model.json.extras.atpInteractions = {version: 1, eyes: {Open: [0], Closed: [1]}}
        const events = [{frame: 0, type: 'EyeSet', state: 'Closed', enableBlink: false},
            {frame: 1, type: 'EyeSet', state: 'Open', enableBlink: true}]
        source.json.extras.atpClip.eventProfile = 'ponybook-v1'
        source.json.extras.atpClip.events = events
        await assert.rejects(bindAnimation(model.gltf, source.gltf, ref), /events are not supported/)
        const clip = await bindAnimation(model.gltf, source.gltf, ref, true)
        assert.deepEqual(clip.nativeEvents, events)
        assert.equal(clip.nativeFPS, 2)
        assert.notEqual(clip.nativeEvents, events)
        assert.equal(clip.tracks[0].getInterpolation(), sampling === 'native' ? undefined : InterpolateDiscrete)
        source.json.extras.atpClip.events.push({frame: 1, type: 'Sound', file: 'unhandled'})
        await assert.rejects(bindAnimation(model.gltf, source.gltf, ref, true), /Unsupported native animation event/)
    }
})

test('native sampling interpolates raw global quaternions before deriving local joints', async () => {
    const {model, source, ref, rotations} = nativeFixture()
    const clip = await bindAnimation(model.gltf, source.gltf, ref)
    const mixer = new AnimationMixer(model.gltf.scene)
    let finished = 0
    mixer.addEventListener('finished', () => finished++)
    const action = mixer.clipAction(clip).setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    action.play()
    mixer.update(.25)
    model.gltf.scene.updateMatrixWorld(true)
    const native = new Quaternion(0, 0, -rotations[10] / 2, (.8 - rotations[11]) / 2).normalize()
    assert.ok(1 - Math.abs(model.nodes[1].quaternion.dot(native)) < 1e-10)
    assert.ok(model.nodes[2].getWorldPosition(new Vector3()).distanceTo(new Vector3(1, 0, 0)) < 1e-6,
        'Global child translation stays constant despite the rotating parent')
    assert.ok(1 - Math.abs(model.nodes[2].getWorldQuaternion(new Quaternion()).w) < 1e-6)
    assert.ok(Math.abs(model.nodes[1].quaternion.z - Math.sin(Math.PI / 8)) > .01,
        'Unequal raw lengths are preserved, not pre-normalized or local SLERP')
    mixer.update(.5)
    const tail = model.nodes[1].quaternion.clone()
    mixer.update(.25)
    assert.equal(finished, 1)
    assert.equal(action.paused, true)
    assert.ok(1 - Math.abs(tail.dot(model.nodes[1].quaternion)) < 1e-6)
    mixer.stopAllAction()
    assert.deepEqual(model.nodes[1].position.toArray(), [0, 0, 0])
    assert.deepEqual(model.nodes[1].quaternion.toArray(), [0, 0, 0, 1])
    mixer.uncacheRoot(model.gltf.scene)
})


test('per-model event bindings reuse skeletal source without leaking events between references', async () => {
    const {model, source, ref} = fixture()
    model.json.extras.atpInteractions = {version: 1, eyes: {Open: [0], Closed: [1]}}
    delete source.json.extras.atpClip.events
    const closed: AnimationRef = {...ref, eventBinding: {version: 1, events: [
        {frame: 0, type: 'EyeSet', state: 'Closed', enableBlink: false},
    ]}}
    const opened: AnimationRef = {...ref, id: 'other', eventBinding: {version: 1, events: [
        {frame: 1, type: 'EyeSet', state: 'Open', enableBlink: true},
    ]}}
    const a = await bindAnimation(model.gltf, source.gltf, closed, true)
    const b = await bindAnimation(model.gltf, source.gltf, opened, true)
    assert.deepEqual(a.nativeEvents, closed.eventBinding!.events)
    assert.deepEqual(b.nativeEvents, opened.eventBinding!.events)
    assert.equal(source.json.extras.atpClip.events, undefined)
    await assert.rejects(bindAnimation(model.gltf, source.gltf, closed), /events are not supported/)
    source.json.extras.atpClip.eventProfile = 'ponybook-v1'
    source.json.extras.atpClip.events = [{frame: 0, type: 'Sound'}]
    await assert.rejects(bindAnimation(model.gltf, source.gltf, closed, true), /competing.*event/i)
})


async function visibilityFixture(events: any[], fps = 30, frames = 150) {
    const f = fixture()
    const meshes = [true, false, false].map(visible => {
        const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial())
        mesh.name = 'duplicate_mesh_name'
        mesh.visible = visible
        return mesh
    })
    f.model.gltf.scene.add(...meshes)
    const json = f.model.json
    json.scenes = [{nodes: [0, 3]}]
    json.extras.atpInteractions = {version: 1, subObjects: [10, 11, 12], hiddenNodes: [4, 5],
        eyes: {Open: [10], Closed: [11]}, effects: {stars: {}}}
    for (let i = 0; i < meshes.length; i++) {
        json.nodes.push({extras: {atpNativeMeshIndex: i + 10, atpDefaultVisible: i === 0}})
        f.model.gltf.parser.associations.set(meshes[i], {nodes: i + 3})
    }
    const dependency = f.model.gltf.parser.getDependency.bind(f.model.gltf.parser)
    f.model.gltf.parser.getDependency = async (type, index) => index >= 3 ? meshes[index - 3] : dependency(type, index)
    const times = Array.from({length: frames + 1}, (_, i) => i / fps)
    for (const track of f.source.gltf.animations[0].tracks) {
        const width = track.getValueSize(), initial = Array.from(track.values).slice(0, width)
        track.times = new Float32Array(times)
        track.values = new Float32Array(times.flatMap(() => initial))
    }
    f.source.gltf.animations[0].duration = f.ref.duration = frames / fps
    f.source.json.accessors = [{count: frames + 1}, {count: frames + 1}]
    f.source.json.extras.atpClip = {fps, frameCount: frames, duration: frames / fps}
    f.ref.eventBinding = {version: 1, events}
    const eyes = (await prepareNativeEyes(f.model.gltf, new AbortController().signal))!
    const clip = await bindAnimation(f.model.gltf, f.source.gltf, f.ref, true)
    return {...f, meshes, eyes, clip}
}

test('SubObject uses actual Boolean tracks and exact native times, independent of callbacks', async () => {
    for (const [frame, fps] of [[1, 15], [4, 15], [101, 30], [123, 30]]) {
        const f = await visibilityFixture([
            {frame, type: 'SubObject', meshes: [10, 11], visible: true},
            {frame, type: 'SubObject', meshes: [10], visible: false},
        ], fps)
        const tracks = f.clip.tracks.filter(track => track.name.endsWith('.visible'))
        assert.equal(tracks.length, 2)
        for (const track of tracks) {
            assert.ok(track instanceof BooleanKeyframeTrack)
            assert.ok(track.times instanceof Float64Array)
            assert.equal(track.times[1], frame / fps)
        }
        assert.deepEqual(f.clip.nativeEvents, [], 'SubObject must not enter the callback stream')
        const mixer = new AnimationMixer(f.model.gltf.scene)
        mixer.clipAction(f.clip).play()
        const time = frame / fps
        for (const [t, expected] of [[time - 1e-10, [true, false]], [time, [false, true]],
            [time + 1e-10, [false, true]], [time - 1e-10, [true, false]]] as const) {
            mixer.setTime(t)
            assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), expected)
        }
        mixer.stopAllAction()
        assert.deepEqual(f.meshes.map(mesh => mesh.visible), [true, false, false])
        mixer.uncacheRoot(f.model.gltf.scene)
    }
})

test('overlapping EyeSet and SubObject fold in both source orders; blink has a single track writer', async () => {
    for (const eyeFirst of [false, true]) {
        const eye = {frame: 0, type: 'EyeSet', state: 'Closed', enableBlink: true}
        const sub = {frame: 0, type: 'SubObject', meshes: [10, 11], visible: true}
        const events = [...(eyeFirst ? [eye, sub] : [sub, eye]),
            {frame: 1, type: 'Emitter', effect: 'stars'},
            {frame: 30, type: 'SubObject', meshes: [10, 11], visible: true}]
        const f = await visibilityFixture(events)
        const mixer = new AnimationMixer(f.model.gltf.scene)
        const action = mixer.clipAction(f.clip).play()
        f.eyes.useVisibility(f.clip.nativeVisibility)
        const emitted: number[] = []
        const player = nativeEventPlayback(f.clip.nativeEvents, f.clip.nativeFPS, {
            reset() { f.eyes.resetPlayback(); emitted.length = 0 },
            apply(e, age) { if (e.type === 'Emitter') emitted.push(age); else f.eyes.set(e) },
        })
        mixer.update(0); player.update(0)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), eyeFirst ? [true, true] : [false, true])
        const before = f.meshes.map(mesh => mesh.visible)
        f.eyes.update(0) // native first blink tick shows expression; no callback write to tracked meshes
        assert.deepEqual(f.meshes.map(mesh => mesh.visible), before)
        mixer.update(0)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), [false, true])
        f.eyes.resetPlayback(); mixer.update(0); player.reset(); player.update(0)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), eyeFirst ? [true, true] : [false, true], 'reset at the same key must discard blink')
        mixer.setTime(.5); player.update(.5)
        assert.equal(emitted.length, 1)
        assert.ok(Math.abs(emitted[0] - (.5 - 1 / 30)) < 1e-12)
        mixer.setTime(1); player.update(1)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), [true, true], 'later SubObject supersedes blink')
        player.reset(); mixer.setTime(0); player.update(0)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), eyeFirst ? [true, true] : [false, true])
        player.update(0, 1); mixer.update(0)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), eyeFirst ? [true, true] : [false, true])
        mixer.stopAllAction(); f.eyes.useVisibility(); f.eyes.reset()
        assert.deepEqual(f.meshes.map(mesh => mesh.visible), [true, false, false])
        action.reset().play(); f.eyes.useVisibility(f.clip.nativeVisibility); mixer.update(0); player.update(0, 2)
        assert.deepEqual(f.meshes.slice(0, 2).map(mesh => mesh.visible), eyeFirst ? [true, true] : [false, true])
        mixer.stopAllAction(); mixer.uncacheRoot(f.model.gltf.scene)
    }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { prepareWardrobe, type WardrobeProfile } from '../../src/components/model-viewer/wardrobe'

function fixture() {
    const profile: WardrobeProfile = {
        version: 1,
        defaults: {Body: 'body0', Mane: 'mane0', Tail: 'tail0'},
        sets: {
            normal: {Body: 'body0', Mane: 'mane0', Tail: 'tail0'},
            linked: {Body: 'bodyLinked', Mane: 'mane1'},
            plain: {Body: 'body1', Mane: 'mane1'},
            full: {Body: 'body1', Mane: 'mane1', Tail: 'tail1'},
            alias: {Body: 'bodyAlias', Mane: 'mane0'},
            absent: {Body: 'bodyAbsent', Mane: 'mane1'},
        },
        parts: {
            body0: {slot: 'Body', meshes: [0]}, mane0: {slot: 'Mane', meshes: [1]}, tail0: {slot: 'Tail', meshes: [2]},
            bodyLinked: {slot: 'Body', meshes: [3], linked: 'tailLinked'}, mane1: {slot: 'Mane', meshes: [4]},
            tailLinked: {slot: 'Tail', meshes: [5]}, tail1: {slot: 'Tail', meshes: [6]},
            body1: {slot: 'Body', meshes: [7]}, bodyAlias: {slot: 'Body', meshes: [7]},
            bodyAbsent: {slot: 'Body', meshes: [8], linked: 'tailAbsent'}, tailAbsent: {slot: 'Tail', meshes: []},
        },
    }
    const scene = new Group()
    const meshes = Array.from({length: 11}, () => new Mesh(new BoxGeometry(), new MeshBasicMaterial()))
    meshes.forEach((mesh, index) => { mesh.visible = [0, 1, 2, 9, 10].includes(index); scene.add(mesh) })
    const json = {
        nodes: meshes.map((_, index) => ({extras: {atpNativeMeshIndex: index, atpDefaultVisible: [0, 1, 2, 9, 10].includes(index)}})),
        extras: {atpWardrobe: profile, atpInteractions: {version: 1, eyes: {Open: [10]}, subObjects: [9]}},
    }
    const model = {scene, scenes: [scene], parser: {json,
        associations: new Map(meshes.map((mesh, index) => [mesh, {nodes: index}])),
    }} as unknown as GLTF
    const visible = () => meshes.flatMap((mesh, index) => mesh.visible ? [index] : [])
    return {model, profile, json, meshes, visible}
}

test('native part changes preserve skipped slots, clean old links and restore the entry snapshot', () => {
    const f = fixture(), wardrobe = prepareWardrobe(f.model)!
    assert.deepEqual(wardrobe.snapshot(), {Body: 'body0', Mane: 'mane0', Tail: 'tail0'})
    wardrobe.selectPart('tail1')
    wardrobe.selectPart('body1')
    wardrobe.selectPart('mane1')
    assert.deepEqual(wardrobe.snapshot(), {Body: 'body1', Mane: 'mane1', Tail: 'tail1'})
    assert.deepEqual(f.visible(), [4, 6, 7, 9, 10], 'changing body and mane retains the custom tail')
    wardrobe.selectPart('bodyLinked')
    assert.deepEqual(wardrobe.snapshot(), {Body: 'bodyLinked', Mane: 'mane1', Tail: 'tailLinked'})
    assert.deepEqual(f.visible(), [3, 4, 5, 9, 10])
    wardrobe.selectPart('tail1')
    wardrobe.selectPart('body1')
    assert.deepEqual(wardrobe.snapshot(), {Body: 'body1', Mane: 'mane1', Tail: 'tail0'}, 'old linked body cleanup restores the entry tail')
    wardrobe.selectPart('body1')
    assert.deepEqual(wardrobe.snapshot(), {Body: 'body0', Mane: 'mane1', Tail: 'tail0'}, 'selecting the current part reverts only that slot')
    wardrobe.selectPart('bodyAlias')
    wardrobe.selectPart('body1')
    assert.equal(f.meshes[7].visible, true, 'distinct part IDs can share native geometry')
    wardrobe.selectPart('bodyAbsent')
    assert.deepEqual(wardrobe.snapshot(), {Body: 'bodyAbsent', Mane: 'mane1', Tail: 'tailAbsent'})
    assert.deepEqual(f.visible(), [4, 8, 9, 10], 'an explicit no-geometry tail hides all wardrobe tails')
    for (const id of ['tailLinked', 'another-owner-part', null]) assert.throws(() => wardrobe.selectPart(id as string))
    assert.deepEqual(f.visible(), [4, 8, 9, 10], 'rejected selections leave the appearance intact')
    wardrobe.selectPart('bodyAbsent')
    wardrobe.selectPart('mane1')
    assert.deepEqual(wardrobe.snapshot(), {Body: 'body0', Mane: 'mane0', Tail: 'tail0'})
    assert.deepEqual(f.visible(), [0, 1, 2, 9, 10], 'part changes do not take ownership of eyes or props')
    const copy = wardrobe.snapshot(); copy.Body = 'body1'
    assert.equal(wardrobe.snapshot().Body, 'body0')
})

test('wardrobe validates owner-local mesh and linked references before changing visibility', () => {
    const missing = fixture()
    missing.profile.parts.body1.meshes = [99]
    assert.throws(() => prepareWardrobe(missing.model), /mesh/i)
    const external = fixture()
    external.profile.parts.body1.linked = 'another-owner-part'
    assert.throws(() => prepareWardrobe(external.model), /link/i)
    const overlap = fixture()
    overlap.profile.parts.body1.meshes = [10]
    assert.throws(() => prepareWardrobe(overlap.model), /controller|overlap/i)
    assert.deepEqual(overlap.visible(), [0, 1, 2, 9, 10])
    const absent = fixture()
    delete (absent.json.extras as any).atpWardrobe
    assert.equal(prepareWardrobe(absent.model), undefined)
})

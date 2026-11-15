import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene, Texture } from 'three'
import { nativeUVClock, applyNativeDepth } from '../../src/components/model-viewer/native-materials'

function fixture() {
    const scene = new Scene()
    const materials = [0,1,2].map(() => new MeshBasicMaterial({map: new Texture()}))
    for (const material of materials) scene.add(new Mesh(new BoxGeometry(), material))
    const settings = { version: 1, initial: 1, speed: .15, min: -2, max: 2 }
    for (const m of materials.slice(1)) {
        m.userData.atpNativeUVClock = {...settings}
        m.map!.offset.y = .528
    }
    return {gltf: {scene} as any, materials}
}

test('hair keeps its initial GPU offset until tick, then uses one shared CPU clock', () => {
    const {gltf, materials} = fixture()
    const clock = nativeUVClock(gltf)
    assert.equal(materials[1].map!.offset.y, .528)
    clock.update(0)
    assert.equal(materials[1].map!.offset.y, -1)
    clock.update(1)
    assert.equal(materials[1].map!.offset.y, -1.15)
    assert.equal(materials[2].map!.offset.y, -1.15)
    assert.equal(materials[0].map!.offset.y, 0)
    assert.equal(materials[1].opacity, 1)
})

test('ordinary material stays static and native depth state remains independent', () => {
    const {gltf, materials} = fixture()
    for (const material of materials) {
        delete material.userData.atpNativeUVClock
        material.userData.atpNativeDepth = {write: false, test: true}
    }
    applyNativeDepth(gltf)
    const clock = nativeUVClock(gltf)
    assert.equal(clock.active, false)
    clock.update(10)
    assert.equal(materials[0].depthWrite, false)
    assert.equal(materials[0].depthTest, true)
    assert.equal(materials[1].map!.offset.y, .528)
})

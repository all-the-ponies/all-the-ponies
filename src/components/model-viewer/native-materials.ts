import { Mesh, SkinnedMesh, Texture } from 'three'
import type { RenderItem } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

export function applyNativeDepth(model: GLTF) {
    model.scene.traverse(object => {
        if (!(object instanceof Mesh)) return
        for (const material of [object.material].flat()) {
            const depth = material.userData.atpNativeDepth
            if (depth === undefined) continue
            if (!depth || typeof depth.write !== 'boolean' || typeof depth.test !== 'boolean') {
                throw new Error('Invalid native depth state')
            }
            material.depthWrite = depth.write
            material.depthTest = depth.test
        }
    })
}

/** Preserve Three's transparent sort, using native submission order only at a tied depth. */
export function nativeTransparentSort(a: RenderItem, b: RenderItem) {
    if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder
    if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder
    if (a.z !== b.z) return b.z - a.z
    const left = a.object, right = b.object
    if (a.material.transparent && b.material.transparent
        && left instanceof SkinnedMesh && right instanceof SkinnedMesh
        && left.skeleton && left.skeleton === right.skeleton) {
        const leftIndex = left.userData.atpNativeMeshIndex
        const rightIndex = right.userData.atpNativeMeshIndex
        if (Number.isInteger(leftIndex) && Number.isInteger(rightIndex) && leftIndex !== rightIndex) {
            return rightIndex - leftIndex
        }
    }
    return a.id - b.id
}

/** The native Pony controller shares one CPU clock across its hair materials. */
export function nativeUVClock(model: GLTF) {
    type Clock = { version: 1, initial: number, speed: number, min: number, max: number }
    let settings: Clock | undefined
    const textures = new Set<Texture>()
    model.scene.traverse(object => {
        if (!(object instanceof Mesh)) return
        for (const material of [object.material].flat()) {
            const value = material.userData.atpNativeUVClock as Clock | undefined
            if (value === undefined) continue
            if (value?.version !== 1 || ![value.initial, value.speed, value.min, value.max].every(Number.isFinite)
                || value.speed <= 0 || value.min > value.max) {
                throw new Error('Invalid native material clock')
            }
            if (settings && (['initial', 'speed', 'min', 'max'] as const).some(key => settings![key] !== value[key])) {
                throw new Error('Conflicting native material clocks')
            }
            const map = (material as typeof material & { map?: Texture }).map
            if (!map?.isTexture) throw new Error('Native material clock has no texture')
            settings = value
            textures.add(map)
        }
    })
    let clock = settings?.initial ?? 0
    return {
        active: Boolean(settings),
        update(delta: number) {
            if (!settings) return
            clock += delta * settings.speed
            if (clock > settings.max) clock = settings.min
            for (const texture of textures) texture.offset.y = -clock
        },
        snapshot: () => settings ? { clock, offsets: [...textures].map(t => t.offset.y) } : undefined,
    }
}

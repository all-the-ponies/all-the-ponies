import { createAssetUrl } from '../../scripts/assets'
import type { NativeEvent } from './interactions'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

export interface AssetRef {
    path: string
    sha256: string
    bytes: number
    rigKey: string
}

export interface AnimationRef extends AssetRef {
    id: string
    name: string
    duration: number
    eventBinding?: {version: 1, events: NativeEvent[]}
}

export interface ActorRef extends AssetRef {
    animations: AnimationRef[]
}

export interface AdditionalActorRef {
    model: ActorRef
    transform: number[]
    parentRoot: number
    controller: 'native-first-then-random-v1'
}

export interface ModelRef extends ActorRef {
    preferredAnimations?: string[]
    additionalActor?: AdditionalActorRef
    interactions?: {version: 1, clickAnimations: string[], dizzyAnimation?: string}
}

const cataloguePath = 'models_3d.json'
const digestPattern = /^[a-f0-9]{64}$/

function check(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message)
}

function checkAsset(value: AssetRef, expectedName?: string, allowFixedModel = false) {
    check(value && digestPattern.test(value.sha256) && digestPattern.test(value.rigKey), 'Invalid 3D resource identity')
    // Asset keys, never URLs: createAssetUrl also accepts absolute URLs, which
    // must not let a catalogue choose a different host or a private endpoint.
    const prefix = `models/3d/${value.sha256}/`
    const name = typeof value.path === 'string' && value.path.startsWith(prefix) && value.path.endsWith('.glb')
        ? value.path.slice(prefix.length, -4) : ''
    const named = name.length > 0 && !/[^A-Za-z0-9_-]/.test(name)
        && (expectedName === undefined || name === expectedName)
    const fixedName = /^models\/3d\/([A-Za-z0-9_-]+)\.glb$/.exec(value.path)?.[1]
    const fixed = allowFixedModel && fixedName !== undefined && value.path === `models/3d/${fixedName}.glb`
        && (expectedName === undefined || fixedName === expectedName)
    check(value.path === `models/3d/${value.sha256}.glb` || named || fixed, 'Invalid 3D resource path')
    check(Number.isSafeInteger(value.bytes) && value.bytes > 0, 'Invalid 3D resource size')
}

function checkActor(model: ActorRef, playable = false, identity?: string) {
    checkAsset(model, identity, identity !== undefined)
    check(Array.isArray(model.animations) && (!playable || model.animations.length > 0), 'Invalid animation list')
    const ids = new Set<string>()
    for (const animation of model.animations) {
        check(typeof animation.id === 'string' && animation.id.length > 0 && !ids.has(animation.id), 'Invalid animation identity')
        checkAsset(animation, animation.id)
        check(typeof animation.name === 'string' && animation.name.length > 0, 'Invalid animation name')
        check(Number.isFinite(animation.duration) && (playable ? animation.duration > 0 : animation.duration >= 0), 'Invalid animation duration')
        check(animation.rigKey === model.rigKey, 'Animation rig is incompatible')
        if (Object.prototype.hasOwnProperty.call(animation, 'eventBinding')) {
            const binding = animation.eventBinding
            check(binding?.version === 1 && Object.keys(binding).sort().join(',') === 'events,version'
                && Array.isArray(binding.events), 'Unsupported animation event binding')
        }
        ids.add(animation.id)
    }
}

export function checkAdditionalActor(actor: AdditionalActorRef) {
    check(actor && actor.controller === 'native-first-then-random-v1', 'Unsupported additional actor controller')
    check(Number.isSafeInteger(actor.parentRoot) && actor.parentRoot >= 0, 'Invalid parent root index')
    checkActor(actor.model, true)
    check(actor.model.path === `models/3d/${actor.model.sha256}.glb`, 'Invalid additional actor model path')
    check(!Object.prototype.hasOwnProperty.call(actor, 'additionalActor')
        && !Object.prototype.hasOwnProperty.call(actor.model, 'additionalActor'), 'Nested additional actors are unsupported')
    const m = actor.transform
    check(Array.isArray(m) && m.length === 16 && m.every(Number.isFinite), 'Invalid additional actor transform')
    check([3, 7, 11].every(i => Math.abs(m[i]) <= 1e-6) && Math.abs(m[15] - 1) <= 1e-6, 'Non-affine additional actor transform')
    const lengths = [0, 4, 8].map(i => Math.hypot(m[i], m[i+1], m[i+2]))
    check(lengths.every(v => Number.isFinite(v) && v > 0 && Math.abs(v / lengths[0] - 1) <= 1e-6), 'Invalid additional actor scale')
    const columns = [0, 4, 8].map((i, j) => [m[i], m[i+1], m[i+2]].map(v => v / lengths[j]))
    const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0)
    const [a, b, c] = columns
    const cross = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
    check(Math.abs(dot(a,b)) <= 1e-6 && Math.abs(dot(a,c)) <= 1e-6 && Math.abs(dot(b,c)) <= 1e-6
        && Math.abs(dot(cross,c) - 1) <= 1e-6, 'Invalid additional actor rotation')
}

async function fetchJson(path: string, signal: AbortSignal, version?: string) {
    signal.throwIfAborted()
    const url = new URL(createAssetUrl(path))
    if (version) url.searchParams.set('v', version)
    const response = await fetch(url, { signal, credentials: 'omit', redirect: 'error', cache: 'no-cache' })
    check(response.ok, `3D catalogue request failed (${response.status})`)
    const value: unknown = await response.json()
    signal.throwIfAborted()
    return value
}

/** Use ATP's uploaded manifest version, not a pre-upload JSON byte digest.
 * game-data rewrites JSON before upload; its manifest hashes the final bytes.
 * The JSON describes resources semantically; binary GLBs are verified below.
 */
export async function resolveModel(identity: string, signal: AbortSignal): Promise<ModelRef | null> {
    const manifest = await fetchJson('manifest.json', signal) as Record<string, unknown>
    check(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Invalid asset manifest')
    if (!Object.prototype.hasOwnProperty.call(manifest, cataloguePath)) return null
    const version = manifest[cataloguePath]
    check(typeof version === 'string' && digestPattern.test(version), 'Invalid 3D catalogue version')
    const catalogue = await fetchJson(cataloguePath, signal, version) as {
        schemaVersion: number
        models: Record<string, ModelRef>
        animationAssets?: AnimationRef[]
    }
    check([1, 2, 3, 4].includes(catalogue?.schemaVersion) && catalogue.models && typeof catalogue.models === 'object'
        && !Array.isArray(catalogue.models), 'Unsupported 3D catalogue')
    const table = catalogue.animationAssets
    if (Object.prototype.hasOwnProperty.call(catalogue, 'animationAssets')) {
        check(catalogue.schemaVersion === 4, 'Compact animation assets require catalogue version 4')
        check(Array.isArray(table), 'Invalid animation asset table')
        check(table.every(asset => asset && typeof asset === 'object' && !Array.isArray(asset)), 'Invalid animation asset table entry')
    }
    function assetAt(index: unknown): AnimationRef {
        check(catalogue.schemaVersion === 4 && table && Number.isSafeInteger(index)
            && (index as number) >= 0 && (index as number) < table.length, 'Invalid compact animation asset reference')
        return table[index as number]
    }
    function expandAnimations(actor: ActorRef) {
        check(actor && Array.isArray(actor.animations), 'Invalid animation list')
        actor.animations = (actor.animations as unknown[]).map(item => {
            if (typeof item === 'number') return assetAt(item)
            check(item && typeof item === 'object' && !Array.isArray(item), 'Invalid animation reference')
            check(!Object.prototype.hasOwnProperty.call(item, 'asset'), 'Invalid compact animation reference')
            return item as AnimationRef
        })
    }
    if (!Object.prototype.hasOwnProperty.call(catalogue.models, identity)) return null
    const model = catalogue.models[identity]
    expandAnimations(model)
    checkActor(model, false, identity)
    if (Object.prototype.hasOwnProperty.call(model, 'additionalActor')) {
        check(catalogue.schemaVersion >= 2, 'Additional actors require catalogue version 2 or later')
        expandAnimations(model.additionalActor?.model)
        checkAdditionalActor(model.additionalActor!)
    }
    if (Object.prototype.hasOwnProperty.call(model, 'interactions')) {
        const value = model.interactions
        check([3, 4].includes(catalogue.schemaVersion) && value?.version === 1
            && Object.keys(value).every(key => ['version', 'clickAnimations', 'dizzyAnimation'].includes(key)), 'Unsupported interaction controller')
        const ids = new Set(model.animations.map(animation => animation.id))
        check(Array.isArray(value.clickAnimations) && new Set(value.clickAnimations).size === value.clickAnimations.length
            && value.clickAnimations.every(id => ids.has(id)), 'Invalid click animation reference')
        check(value.dizzyAnimation === undefined || ids.has(value.dizzyAnimation), 'Invalid dizzy animation reference')
    }
    const ids = new Set(model.animations.map(animation => animation.id))
    if (model.preferredAnimations !== undefined) check(Array.isArray(model.preferredAnimations)
        && new Set(model.preferredAnimations).size === model.preferredAnimations.length
        && model.preferredAnimations.every(id => ids.has(id)), 'Invalid preferred animation reference')
    if (model.animations.some(animation => animation.eventBinding !== undefined))
        check(catalogue.schemaVersion === 4 && model.interactions !== undefined, 'Animation event bindings require the native controller and catalogue version 4')
    return model
}

export async function verifiedBytes(ref: AssetRef, signal: AbortSignal): Promise<ArrayBuffer> {
    // Identity and resource role are checked by resolveModel; this boundary
    // checks the safe key again before fetching and verifies the actual bytes.
    checkAsset(ref, undefined, true)
    signal.throwIfAborted()
    const immutable = ref.path === `models/3d/${ref.sha256}.glb`
        || ref.path.startsWith(`models/3d/${ref.sha256}/`)
    const response = await fetch(createAssetUrl(ref.path), {
        signal, credentials: 'omit', redirect: 'error', cache: immutable ? 'default' : 'no-cache',
    })
    check(response.ok, `3D resource request failed (${response.status})`)
    const bytes = await response.arrayBuffer()
    signal.throwIfAborted()
    check(bytes.byteLength === ref.bytes, '3D resource size mismatch')
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    signal.throwIfAborted()
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    check(hash === ref.sha256, '3D resource digest mismatch')
    return bytes
}

export function disposeGLTF(gltf: GLTF) {
    const geometries = new Set<any>(), materials = new Set<any>(), textures = new Set<any>()
    const skeletons = new Set<any>(), images = new Set<ImageBitmap>()
    for (const scene of gltf.scenes) scene.traverse((object: any) => {
        if (object.geometry) geometries.add(object.geometry)
        if (object.skeleton) skeletons.add(object.skeleton)
        for (const material of [object.material].flat().filter(Boolean)) {
            materials.add(material)
            for (const value of Object.values(material) as any[]) if (value?.isTexture) textures.add(value)
        }
    })
    for (const texture of textures) {
        if (typeof texture.source?.data?.close === 'function') images.add(texture.source.data)
        texture.dispose()
    }
    for (const image of images) image.close()
    for (const item of [...geometries, ...materials, ...skeletons]) item.dispose()
}

export async function loadGLB(ref: AssetRef, signal: AbortSignal): Promise<GLTF> {
    const bytes = await verifiedBytes(ref, signal)
    // This profile embeds all buffers and images. Reject external dependencies
    // before GLTFLoader can fetch anything beyond the verified catalogue key.
    const header = new DataView(bytes)
    check(bytes.byteLength >= 20 && header.getUint32(0, true) === 0x46546c67
        && header.getUint32(4, true) === 2 && header.getUint32(8, true) === bytes.byteLength
        && header.getUint32(16, true) === 0x4e4f534a, 'Invalid GLB header')
    const length = header.getUint32(12, true)
    check(length <= bytes.byteLength - 20, 'Truncated GLB JSON')
    const document = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, length)))
    check([...(document.buffers ?? []), ...(document.images ?? [])].every(item => item.uri === undefined),
        'External GLB resources are unsupported')
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
    signal.throwIfAborted()
    const gltf = await new GLTFLoader().parseAsync(bytes, '')
    if (signal.aborted) {
        disposeGLTF(gltf)
        signal.throwIfAborted()
    }
    return gltf
}

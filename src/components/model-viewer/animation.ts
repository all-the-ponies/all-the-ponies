import { AnimationClip, BooleanKeyframeTrack, Interpolant, Mesh, Object3D, Quaternion, Vector3 } from 'three';
import type { TypedArray } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { AnimationRef } from './assets';
import { nativeEvents, type NativeEvent, type NativeVisibility } from './interactions';

export type BoundAnimation = AnimationClip & {nativeEvents: Exclude<NativeEvent, {type: 'SubObject'}>[], nativeFPS: number, nativeVisibility: NativeVisibility}

type Rig = {
    version: 1,
    key: string,
    parents: number[],
    jointNodes: number[],
    coordinateSystem: 'native-Y-down-to-glTF-Y-up-RxPi',
}

function check(value: unknown, message: string): asserts value {
    if (!value) throw new Error(message)
}

export function rigMetadata(gltf: GLTF): Rig {
    const json = gltf.parser.json
    const rig = json.extras?.atpRig as Rig
    check(rig?.version === 1 && /^[a-f0-9]{64}$/.test(rig.key)
        && rig.coordinateSystem === 'native-Y-down-to-glTF-Y-up-RxPi', 'Unsupported rig metadata')
    check(Array.isArray(rig.parents) && rig.parents.length > 0
        && rig.parents.length === rig.jointNodes?.length, 'Invalid rig layout')
    check(new Set(rig.jointNodes).size === rig.parents.length, 'Duplicate joint nodes')
    for (let i = 0; i < rig.parents.length; i++) {
        const parent = rig.parents[i]
        const node = rig.jointNodes[i]
        check(Number.isInteger(parent) && parent >= -1 && parent < i
            && Number.isInteger(node) && node > 0 && json.nodes[node], 'Invalid joint index')
        const expectedParent = parent < 0 ? 0 : rig.jointNodes[parent]
        check(json.nodes[expectedParent]?.children?.includes(node), 'Rig hierarchy mismatch')
    }
    return rig
}

export function jointObjects(gltf: GLTF) {
    const rig = rigMetadata(gltf)
    const objects = new Map<number, Object3D>()
    gltf.scene.traverse(object => {
        const index = gltf.parser.associations.get(object)?.nodes
        if (rig.jointNodes.includes(index)) {
            check(!objects.has(index), 'Ambiguous joint association')
            objects.set(index, object)
        }
    })
    check(objects.size === rig.jointNodes.length, 'Missing model joints')
    return objects
}

/** v1 retains packed quaternion lengths: normalizing each key before NLERP
 * changes the native result. Interpolate model-space poses, then derive locals.
 * All tracks in one bound clip share this work for a given mixer time. */
async function nativeSampler(animation: GLTF, parents: number[], frameCount: number, fps: number) {
    const json = animation.parser.json
    const metadata = json.extras.atpClip.nativeSampling
    if (metadata === undefined) return undefined
    check(metadata && metadata.version === 1
        && Object.keys(metadata).sort().join(',') === 'rotations,translations,version', 'Unsupported native sampling profile')
    const count = frameCount * parents.length
    async function values(index: unknown, width: number, type: string) {
        check(Number.isInteger(index) && (index as number) >= 0, 'Invalid native sampling accessor')
        const definition = json.accessors[index as number]
        check(definition?.componentType === 5126 && definition.type === type
            && definition.count === count && !definition.normalized && !definition.sparse, 'Invalid native sampling layout')
        const attribute = await animation.parser.getDependency('accessor', index as number)
        check(attribute?.count === count && attribute.itemSize === width, 'Invalid loaded native sampling layout')
        const result = new Float32Array(count * width)
        for (let i = 0; i < count; i++) for (let k = 0; k < width; k++) {
            const value = attribute.getComponent(i, k)
            check(Number.isFinite(value), 'Non-finite native sampling value')
            result[i * width + k] = value
        }
        return result
    }
    const translations = await values(metadata.translations, 3, 'VEC3')
    const rotations = await values(metadata.rotations, 4, 'VEC4')
    for (let i = 0; i < count; i++) {
        check(Math.hypot(...rotations.subarray(i * 4, i * 4 + 4)) > .5, 'Degenerate native sampling quaternion')
    }
    const positions = parents.map(() => new Vector3())
    const quaternions = parents.map(() => new Quaternion())
    const localPositions = new Float64Array(parents.length * 3)
    const localRotations = new Float64Array(parents.length * 4)
    const inverse = new Quaternion(), local = new Quaternion(), point = new Vector3()
    const result = {translation: localPositions, rotation: localRotations}
    let previousTime = NaN
    return (time: number) => {
        if (time !== previousTime) {
            previousTime = time
            // Preserve the existing inclusive clip duration and held final frame.
            const frame = Math.max(0, Math.min(time * fps, frameCount - 1))
            const first = Math.floor(frame), next = Math.min(first + 1, frameCount - 1), phase = frame - first
            for (let bone = 0; bone < parents.length; bone++) {
                const a = (first * parents.length + bone), b = (next * parents.length + bone)
                const p = positions[bone], q = quaternions[bone]
                p.fromArray(translations, a * 3)
                point.fromArray(translations, b * 3)
                p.lerp(point, phase)
                let dot = 0
                for (let k = 0; k < 4; k++) dot += rotations[a * 4 + k] * rotations[b * 4 + k]
                const sign = dot < 0 ? -1 : 1
                q.set(...[0, 1, 2, 3].map(k => (1 - phase) * rotations[a * 4 + k]
                    + phase * sign * rotations[b * 4 + k]) as [number, number, number, number]).normalize()
            }
            for (let bone = 0; bone < parents.length; bone++) {
                const parent = parents[bone]
                if (parent < 0) {
                    positions[bone].toArray(localPositions, bone * 3)
                    quaternions[bone].toArray(localRotations, bone * 4)
                } else {
                    inverse.copy(quaternions[parent]).conjugate()
                    point.copy(positions[bone]).sub(positions[parent]).applyQuaternion(inverse).toArray(localPositions, bone * 3)
                    local.multiplyQuaternions(inverse, quaternions[bone]).toArray(localRotations, bone * 4)
                }
            }
        }
        return result
    }
}

class NativeInterpolant extends Interpolant {
    constructor(times: TypedArray, values: TypedArray, size: number, result: TypedArray | undefined,
        private sample: NonNullable<Awaited<ReturnType<typeof nativeSampler>>>,
        private bone: number, private path: 'translation' | 'rotation') {
        super(times, values, size, result)
    }
    evaluate(time: number) {
        const values = this.sample(time)[this.path]
        for (let k = 0; k < this.valueSize; k++) this.resultBuffer[k] = values[this.bone * this.valueSize + k]
        return this.resultBuffer
    }
    interpolate_(_index: number, _start: number, time: number, _end: number) { return this.evaluate(time) }
}

/** Native frame/fps boundaries must not be rounded to Float32 (e.g. 1/15).
 * These tracks are runtime-only; glTF keeps its standard skeletal channels. */
class VisibilityTrack extends BooleanKeyframeTrack {}
Object.assign(VisibilityTrack.prototype, {TimeBufferType: Float64Array})

function visibilityTracks(model: GLTF, events: NativeEvent[], fps: number) {
    const targets = new Set(events.flatMap(event => event.type === 'SubObject' ? event.meshes : []))
    const groups = model.parser.json.extras?.atpInteractions?.eyes ?? {}
    const eyeMeshes = new Set<number>(Object.values(groups).flat() as number[])
    const states = new Map<number, {track: VisibilityTrack, key: number, blink?: {key: number, visible: boolean}}>()
    model.scene.traverse(mesh => {
        if (!(mesh instanceof Mesh)) return
        const node = model.parser.json.nodes[model.parser.associations.get(mesh)?.nodes]
        const index = node?.extras?.atpNativeMeshIndex
        if (!targets.has(index)) return
        check(!states.has(index) && typeof node.extras.atpDefaultVisible === 'boolean', 'Invalid visibility track target')
        const times = [0], values = [node.extras.atpDefaultVisible]
        for (const event of events) {
            let visible: boolean
            if (event.type === 'SubObject' && event.meshes.includes(index)) visible = event.visible
            else if (event.type === 'EyeSet' && eyeMeshes.has(index)) visible = event.state !== 'None' && groups[event.state].includes(index)
            else continue
            const time = event.frame / fps
            // Folding only equal timestamps keeps native source order, including
            // repeated values: a later key must still supersede an earlier blink.
            if (times[times.length - 1] === time) values[values.length - 1] = visible
            else { times.push(time); values.push(visible) }
        }
        const track = new VisibilityTrack(`${mesh.uuid}.visible`, times, values)
        const state: {track: VisibilityTrack, key: number, blink?: {key: number, visible: boolean}} = {track, key: 0}
        states.set(index, state)
        const create = track.InterpolantFactoryMethodDiscrete.bind(track)
        Object.assign(track, {createInterpolant(result?: Parameters<typeof create>[0]) {
            const interpolant = create(result)
            const evaluate = interpolant.evaluate.bind(interpolant)
            interpolant.evaluate = (time: number) => {
                const value = evaluate(time)
                let low = 0, high = track.times.length
                while (low + 1 < high) {
                    const middle = (low + high) >>> 1
                    if (track.times[middle] <= time) low = middle
                    else high = middle
                }
                state.key = low
                if (state.blink?.key !== low) state.blink = undefined
                value[0] = state.blink ? state.blink.visible : track.values[low]
                return value
            }
            return interpolant
        }})
    })
    check(states.size === targets.size, 'Unresolved visibility track target')
    const controller: NativeVisibility = {
        owns(index) { return states.has(index) },
        blink(index, visible) { const state = states.get(index); if (state) state.blink = {key: state.key, visible} },
        reset() { for (const state of states.values()) state.blink = undefined },
    }
    return {tracks: [...states.values()].map(state => state.track), controller}
}

/** Bind by verified node indices, never bone names or bone count alone. */
export async function bindAnimation(model: GLTF, animation: GLTF, ref: AnimationRef, allowNativeEvents = false): Promise<BoundAnimation> {
    const targetRig = rigMetadata(model)
    const sourceRig = rigMetadata(animation)
    const json = animation.parser.json
    check(ref.rigKey === targetRig.key && sourceRig.key === targetRig.key
        && JSON.stringify(targetRig.parents) === JSON.stringify(sourceRig.parents)
        && JSON.stringify(targetRig.jointNodes) === JSON.stringify(sourceRig.jointNodes), 'Animation rig is incompatible')
    check(json.animations?.length === 1 && animation.animations.length === 1, 'Expected one independent animation')
    const metadata = json.extras?.atpClip
    check(Number.isInteger(metadata?.frameCount) && metadata.frameCount > 0
        && Number.isFinite(metadata.fps) && metadata.fps > 0, 'Invalid animation metadata')
    const binding = ref.eventBinding
    if (binding !== undefined) {
        check(binding?.version === 1 && Object.keys(binding).sort().join(',') === 'events,version'
            && Array.isArray(binding.events), 'Unsupported animation event binding')
        check(metadata.events === undefined && metadata.eventProfile === undefined, 'Competing animation event sources')
    }
    const events = nativeEvents(model, binding === undefined ? metadata
        : {...metadata, eventProfile: 'ponybook-v1', events: binding.events}, allowNativeEvents)
    check(Math.abs(metadata.frameCount / metadata.fps - ref.duration) < 1e-4
        && Math.abs(metadata.duration - ref.duration) < 1e-4, 'Native animation timing mismatch')
    const source = animation.animations[0]
    const definition = json.animations[0]
    const joints = jointObjects(model)
    const seen = new Set<string>()
    check(source.tracks.length === definition.channels.length
        && source.tracks.length === targetRig.parents.length * 2, 'Animation track layout mismatch')
    const tracks = []
    const nativeTracks: {bone: number, path: 'translation' | 'rotation', track: typeof source.tracks[number]}[] = []
    const sample = await nativeSampler(animation, targetRig.parents, metadata.frameCount, metadata.fps)
    for (let index = 0; index < definition.channels.length; index++) {
        const channel = definition.channels[index]
        const sampler = definition.samplers[channel.sampler]
        const targetIndex = channel.target.node
        const path = channel.target.path
        check(joints.has(targetIndex) && (path === 'translation' || path === 'rotation')
            && sampler?.interpolation === 'STEP', 'Unsupported animation channel')
        const key = `${targetIndex}:${path}`
        check(!seen.has(key), 'Duplicate animation channel')
        seen.add(key)
        const sourceNode = await animation.parser.getDependency('node', targetIndex)
        check(animation.parser.associations.get(sourceNode)?.nodes === targetIndex, 'Animation target association mismatch')
        const property = path === 'translation' ? 'position' : 'quaternion'
        const track = source.tracks[index]
        // GLTFLoader emits these non-morph tracks in channel order. Verify its
        // output before replacing names with the destination object's UUID.
        check(track.name === `${sourceNode.name || sourceNode.uuid}.${property}`
            && track.getValueSize() === (path === 'translation' ? 3 : 4), 'Loader channel order mismatch')
        check(track.times.length === json.accessors[sampler.input]?.count
            && track.values.length / track.getValueSize() === json.accessors[sampler.output]?.count, 'Animation accessor mismatch')
        check(track.times.length === metadata.frameCount + 1
            && track.times.every((time, frame) => Math.abs(time - frame / metadata.fps) < 1e-4), 'Native animation sample timing mismatch')
        const cloned = track.clone()
        cloned.name = `${joints.get(targetIndex)!.uuid}.${property}`
        if (sample) {
            const bone = targetRig.jointNodes.indexOf(targetIndex)
            nativeTracks.push({bone, path, track})
            Object.assign(cloned, {createInterpolant: (result?: TypedArray) =>
                new NativeInterpolant(cloned.times, cloned.values, cloned.getValueSize(), result, sample, bone, path)})
        }
        tracks.push(cloned)
    }
    // Validate once per source frame, sharing its whole-pose calculation.
    if (sample) for (let frame = 0; frame <= metadata.frameCount; frame++) {
        const expected = sample(frame / metadata.fps)
        for (const {bone, path, track} of nativeTracks) {
            const values = expected[path], size = path === 'translation' ? 3 : 4
            let sign = 1
            if (size === 4) {
                let dot = 0
                for (let k = 0; k < 4; k++) dot += values[bone * size + k] * track.values[frame * size + k]
                sign = dot < 0 ? -1 : 1
            }
            for (let k = 0; k < size; k++) check(Math.abs(values[bone * size + k]
                - sign * track.values[frame * size + k]) <= 1e-4, 'Native sampling disagrees with standard animation')
        }
    }
    check(Math.abs(source.duration - ref.duration) < 1e-4, 'Animation duration mismatch')
    const visibility = visibilityTracks(model, events, metadata.fps)
    tracks.push(...visibility.tracks)
    return Object.assign(new AnimationClip(ref.name, metadata.frameCount / metadata.fps, tracks), {
        nativeEvents: events.filter(event => event.type !== 'SubObject'), nativeFPS: metadata.fps, nativeVisibility: visibility.controller,
    })
}

import * as THREE from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { bindAnimation, jointObjects, rigMetadata } from './animation'
import { checkAdditionalActor, disposeGLTF, loadGLB, type AdditionalActorRef } from './assets'
import { applyNativeDepth } from './native-materials'

/** One native AdditionalObject actor, with its own rig and animation clock. */
export async function loadAdditionalActor(ref: AdditionalActorRef, parent: GLTF, signal: AbortSignal,
    wake: () => void, failed: (error: unknown) => void) {
    checkAdditionalActor(ref)
    const parentRig = rigMetadata(parent)
    const root = jointObjects(parent).get(parentRig.jointNodes[ref.parentRoot])
    if (!root) throw new Error('Additional actor parent root is absent')
    const model = await loadGLB(ref.model, signal)
    let disposed = false
    let request: AbortController | undefined
    let generation = 0
    let active = false
    let finished = false
    let currentId = ''
    let transitions = 0
    const clips = new Map<string, THREE.AnimationClip>()
    const mixer = new THREE.AnimationMixer(model.scene)
    const group = new THREE.Group()
    group.matrixAutoUpdate = false
    const restMatrix = new THREE.Matrix4().fromArray(ref.transform)
    const restRoot = new THREE.Vector3()
    const point = new THREE.Vector3()
    function parentPosition(target: THREE.Vector3) {
        parent.scene.updateMatrixWorld(true)
        root!.getWorldPosition(target)
        return parent.scene.worldToLocal(target)
    }
    parentPosition(restRoot)
    function place() {
        parentPosition(point)
        group.matrix.copy(restMatrix)
        // Both points are already in the GLB scene's Rx(pi) coordinates.
        // Native attachment placement follows current root X/Z, not Y.
        group.matrix.elements[12] += point.x - restRoot.x
        group.matrix.elements[14] += point.z - restRoot.z
        group.matrixWorldNeedsUpdate = true
    }
    const onFinished = () => { finished = true }
    mixer.addEventListener('finished', onFinished)

    async function start(index: number) {
        const token = ++generation
        request?.abort()
        const abort = new AbortController()
        request = abort
        active = false
        finished = false
        const animation = ref.model.animations[index]
        try {
            signal.throwIfAborted()
            let clip = clips.get(animation.sha256)
            if (!clip) {
                const source = await loadGLB(animation, abort.signal)
                try { clip = await bindAnimation(model, source, animation) }
                finally { disposeGLTF(source) }
                if (disposed || abort.signal.aborted || token !== generation) return
                clips.set(animation.sha256, clip)
            }
            if (disposed || abort.signal.aborted || token !== generation) return
            signal.throwIfAborted()
            mixer.stopAllAction()
            const action = mixer.clipAction(clip).reset().setLoop(THREE.LoopOnce, 1)
            action.clampWhenFinished = true
            action.play()
            mixer.update(0)
            currentId = animation.id
            transitions++
            active = true
            wake()
        } catch (error) {
            if (!disposed && !abort.signal.aborted && token === generation) throw error
        } finally {
            if (token === generation) request = undefined
        }
    }
    function dispose() {
        if (disposed) return
        disposed = true
        generation++
        active = false
        request?.abort()
        signal.removeEventListener('abort', dispose)
        mixer.removeEventListener('finished', onFinished)
        mixer.stopAllAction()
        mixer.uncacheRoot(model.scene)
        clips.clear()
        group.removeFromParent()
        disposeGLTF(model)
    }
    signal.addEventListener('abort', dispose, { once: true })
    try {
        signal.throwIfAborted()
        if (model.animations.length || rigMetadata(model).key !== ref.model.rigKey) {
            throw new Error('Invalid additional actor model rig')
        }
        applyNativeDepth(model)
        group.add(model.scene)
        place()
        await start(0)
        signal.throwIfAborted()
    } catch (error) { dispose(); throw error }

    const restart = () => {
        if (!disposed) void start(0).catch(failed)
    }
    return {
        group, dispose, restart,
        running: () => !disposed && active,
        place,
        update(delta: number) {
            if (!disposed && active) {
                mixer.update(delta)
                if (finished) {
                    // The entire unfiltered CSV index sequence was validated
                    // by game-data. Never pick from a filtered playable subset.
                    const index = Math.floor(Math.random() * ref.model.animations.length)
                    void start(index).catch(failed)
                }
            }
            if (!disposed) place()
        },
        snapshot: () => ({ disposed, active, loading: Boolean(request), currentId, transitions,
            cachedAnimations: clips.size, matrix: group.matrix.toArray() }),
    }
}

export type AdditionalActor = Awaited<ReturnType<typeof loadAdditionalActor>>

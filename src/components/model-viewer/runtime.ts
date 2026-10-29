import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bindAnimation, jointObjects, rigMetadata, type BoundAnimation } from './animation';
import { disposeGLTF, loadGLB, type AnimationRef, type ModelRef } from './assets';
import { loadAdditionalActor, type AdditionalActor } from './additional';
import { applyNativeDepth, nativeTransparentSort, nativeUVClock } from './native-materials';
import { hitsModel, nativeEventPlayback, nativeGestures, prepareNativeEyes } from './interactions';
import { createNativeEmitters } from './emitter';
import { prepareWardrobe } from './wardrobe';

export type ViewerState = {
    ready: boolean,
    loading: boolean,
    playing: boolean,
    free: boolean,
    activeAnimation: string,
    error: string,
    wardrobeLoading?: boolean,
}

/** Shared position buffers can contain unused vertices; fit rendered triangles. */
function visibleBounds(root: THREE.Object3D) {
    const box = new THREE.Box3()
    const point = new THREE.Vector3()
    root.updateMatrixWorld(true)
    root.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh)) return
        const position = object.geometry.attributes.position
        const indices = object.geometry.index
        const used = new Set<number>()
        for (let i = 0; i < (indices?.count ?? position.count); i++) {
            used.add(indices ? indices.getX(i) : i)
        }
        for (const index of used) {
            point.fromBufferAttribute(position, index)
            if (object instanceof THREE.SkinnedMesh) object.applyBoneTransform(index, point)
            box.expandByPoint(point.applyMatrix4(object.matrixWorld))
        }
    })
    if (box.isEmpty()) throw new Error('Model has no visible geometry')
    return box
}

/** Created only after Vue mounts; this module performs no work during SSR. */
export function mountViewer(host: HTMLElement, ref: ModelRef, changed: (state: ViewerState) => void) {
    const state: ViewerState = {ready: false, loading: true, playing: false, free: false, activeAnimation: '', error: ''}
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, .01, 1000)
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    renderer.setTransparentSort(nativeTransparentSort)
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    const canvas = renderer.domElement
    canvas.tabIndex = 0
    host.appendChild(canvas)
    const controls = new OrbitControls(camera, canvas)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = false
    controls.touches.TWO = undefined
    let disposed = false
    let model: GLTF | undefined
    let additional: AdditionalActor | undefined
    let wardrobe: ReturnType<typeof prepareWardrobe>
    let wardrobeRequest: Promise<void> | undefined
    let materialClock: ReturnType<typeof nativeUVClock> | undefined
    let eyes: Awaited<ReturnType<typeof prepareNativeEyes>>
    let effects: Awaited<ReturnType<typeof createNativeEmitters>> | undefined
    let mixer: THREE.AnimationMixer | undefined
    let rest: {object: THREE.Object3D, position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3}[] = []
    let initial: {position: THREE.Vector3, target: THREE.Vector3, polar: number} | undefined
    let frameId = 0
    let lastTime: number | undefined
    let generation = 0
    let finished = false
    const modelAbort = new AbortController()
    let animationAbort: AbortController | undefined
    const clips = new Map<string, BoundAnimation>()
    let action: THREE.AnimationAction | undefined
    let selected: AnimationRef | undefined
    let loop = false, cycle = 0
    let eventPlayback: ReturnType<typeof nativeEventPlayback> | undefined
    const gestures = nativeGestures()
    const notify = () => changed({...state})
    const render = () => { if (!disposed && model) { effects?.render(); renderer.render(scene, camera) } }

    function cancelFrame() {
        cancelAnimationFrame(frameId)
        frameId = 0
        lastTime = undefined
    }
    function restore() {
        for (const item of rest) {
            item.object.position.copy(item.position)
            item.object.quaternion.copy(item.quaternion)
            item.object.scale.copy(item.scale)
        }
        model?.scene.updateMatrixWorld(true)
        additional?.place()
        eyes?.reset()
    }
    function stop(keepEffects = false) {
        generation++
        animationAbort?.abort()
        animationAbort = undefined
        cancelFrame()
        mixer?.stopAllAction()
        eyes?.useVisibility()
        action = undefined
        restore()
        cycle = 0
        eventPlayback = undefined
        if (!keepEffects) effects?.reset()
        state.playing = false
        state.loading = !state.ready
        state.activeAnimation = ''
        finished = false
        resume()
    }
    function applyEvents() { if (action) eventPlayback?.update(action.time, cycle) }
    function complete() {
        if (finished) { stop(true); notify() }
    }
    const ticking = () => state.playing || additional?.running() || materialClock?.active || eyes?.active || effects?.active
    function frame(time: number) {
        frameId = 0
        if (disposed || document.hidden || !ticking()) return
        const delta = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, .1)
        lastTime = time
        effects?.update(delta)
        if (state.playing) {
            mixer!.update(delta)
            applyEvents()
        }
        // Restore after mixer.update has applied its bindings, not from inside
        // the mixer's finished event, where it is still updating this frame.
        complete()
        additional?.update(delta)
        materialClock?.update(delta)
        if (eyes?.update(delta) && state.playing) mixer!.update(0)
        render()
        resume()
    }
    function resume() {
        if (!disposed && state.ready && !document.hidden && ticking() && !frameId) {
            frameId = requestAnimationFrame(frame)
        }
    }
    function visibility() {
        if (document.hidden) { cancelFrame(); gestures.clear() }
        else { resume(); render() }
    }
    function resize() {
        const width = Math.max(1, host.clientWidth)
        const height = Math.max(1, host.clientHeight)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        render()
    }
    function resetCamera() {
        if (!initial) return
        controls.minPolarAngle = 0
        controls.maxPolarAngle = Math.PI
        camera.position.copy(initial.position)
        controls.target.copy(initial.target)
        controls.update()
        if (!state.free) controls.minPolarAngle = controls.maxPolarAngle = initial.polar
        controls.update()
        render()
    }
    function reset() {
        stop()
        gestures.clear(true)
        state.error = ''
        additional?.restart()
        resetCamera()
        notify()
    }
    function setFree(free: boolean) {
        gestures.clear(true)
        state.free = free
        controls.enableZoom = free
        controls.touches.TWO = free ? THREE.TOUCH.DOLLY_PAN : undefined
        if (free) {
            controls.minPolarAngle = 0
            controls.maxPolarAngle = Math.PI
            controls.update()
            render()
        } else {
            stop()
            resetCamera()
        }
        notify()
    }
    function keydown(event: KeyboardEvent) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const offset = camera.position.clone().sub(controls.target)
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), event.key === 'ArrowLeft' ? .1 : -.1)
        camera.position.copy(controls.target).add(offset)
        controls.update()
    }
    function pointerdown(event: PointerEvent) {
        if (!state.ready || disposed || document.hidden) return
        gestures.down(event, controls.enabled && controls.enableRotate)
    }
    function pointermove(event: PointerEvent) {
        if (controls.enabled) gestures.move(event, canvas.clientHeight, controls.rotateSpeed)
    }
    function pointerup(event: PointerEvent) {
        const intent = gestures.up(event, canvas.clientHeight, controls.rotateSpeed,
            state.ready && !disposed && !document.hidden && controls.enabled)
        if (!intent || !model || !ref.interactions) return
        if (intent === 'dizzy') {
            const animation = ref.animations.find(item => item.id === ref.interactions!.dizzyAnimation)
            if (animation) void play(animation)
        } else if (hitsModel(model, camera, canvas, event)) {
            let candidates = ref.animations.filter(item => ref.interactions!.clickAnimations.includes(item.id))
            if (candidates.length > 1) candidates = candidates.filter(item => item.id !== state.activeAnimation)
            const animation = candidates[Math.floor(Math.random() * candidates.length)]
            if (animation) void play(animation)
        }
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    controls.addEventListener('change', render)
    canvas.addEventListener('keydown', keydown)
    canvas.addEventListener('pointerdown', pointerdown)
    canvas.addEventListener('pointermove', pointermove)
    canvas.addEventListener('pointerup', pointerup)
    canvas.addEventListener('pointercancel', pointerup)
    document.addEventListener('visibilitychange', visibility)
    const onFinished = () => { finished = true }
    const onLoop = (event: {loopDelta: number}) => {
        cycle += event.loopDelta
        // Three dispatches loop before evaluating tracks. Clear blink overrides
        // here, so the new cycle cannot inherit the preceding cycle's eye pose.
        eventPlayback?.reset()
    }
    function start(clip: BoundAnimation, animation: AnimationRef) {
        selected = animation
        state.loading = false
        state.playing = true
        state.activeAnimation = animation.id
        eyes?.useVisibility(clip.nativeVisibility)
        eventPlayback = nativeEventPlayback(clip.nativeEvents, clip.nativeFPS, {
            reset() { eyes?.resetPlayback(); effects?.reset() },
            apply(event, age) {
                if (event.type === 'Emitter') effects!.trigger(event.effect, age)
                else if (event.type === 'EyeSet') eyes!.set(event)
            },
        })
        action = mixer!.clipAction(clip).reset().setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1).play()
    }
    function seek(time: number) {
        if (!Number.isFinite(time) || time < 0) throw new Error('Invalid animation seek time')
        if (disposed || state.loading || !selected) return
        const clip = clips.get(selected.id)
        if (!clip) return
        if (!state.playing) start(clip, selected)
        eventPlayback!.reset()
        finished = false
        cycle = loop ? Math.floor(time / clip.duration) : 0
        action!.reset().setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1).play()
        action!.time = loop ? time % clip.duration : Math.min(time, clip.duration)
        mixer!.update(0)
        applyEvents()
        additional?.place()
        if (!loop && time >= clip.duration) finished = true
        complete()
        lastTime = undefined
        notify(); render(); resume()
    }
    function setLoop(enabled: boolean) {
        loop = enabled
        if (action) seek(action.time)
    }
    async function replay() { if (selected) await play(selected) }

    async function play(animation: AnimationRef) {
        if (!model || disposed) return
        stop()
        const token = generation
        const abort = new AbortController()
        animationAbort = abort
        state.error = ''
        state.loading = true
        notify()
        try {
            if (!ref.animations.includes(animation)) throw new Error('Animation is not in this model catalogue')
            let clip = clips.get(animation.id)
            if (!clip) {
                const source = await loadGLB(animation, abort.signal)
                try { clip = await bindAnimation(model, source, animation, true) }
                finally { disposeGLTF(source) }
                if (disposed || abort.signal.aborted || token !== generation) return
                clips.set(animation.id, clip)
            }
            if (disposed || abort.signal.aborted || token !== generation) return
            animationAbort = undefined
            start(clip, animation)
            mixer!.update(0)
            applyEvents()
            additional?.place()
            notify()
            render()
            resume()
        } catch (error) {
            if (disposed || abort.signal.aborted || token !== generation) return
            stop()
            state.error = error instanceof Error ? error.message : String(error)
            notify()
            render()
        }
    }

    function releaseModel() {
        effects?.dispose()
        effects = undefined
        eyes = undefined
        wardrobe = undefined
        materialClock = undefined
        mixer?.removeEventListener('finished', onFinished)
        mixer?.removeEventListener('loop', onLoop)
        if (model) { mixer?.uncacheRoot(model.scene); disposeGLTF(model); scene.remove(model.scene); model = undefined }
        mixer = undefined
        clips.clear()
        rest = []
    }
    function dispose() {
        if (disposed) return
        disposed = true
        stop()
        modelAbort.abort()
        additional?.dispose()
        releaseModel()
        gestures.clear(true)
        observer.disconnect()
        controls.removeEventListener('change', render)
        controls.dispose()
        canvas.removeEventListener('keydown', keydown)
        canvas.removeEventListener('pointerdown', pointerdown)
        canvas.removeEventListener('pointermove', pointermove)
        canvas.removeEventListener('pointerup', pointerup)
        canvas.removeEventListener('pointercancel', pointerup)
        document.removeEventListener('visibilitychange', visibility)
        renderer.dispose()
        renderer.forceContextLoss()
        canvas.remove()
    }
    function snapshot() {
        return {
            ...state, disposed, cachedAnimations: clips.size, time: action?.time ?? 0, loop, cycle,
            ...(additional ? { additional: additional.snapshot() } : {}),
            ...(materialClock?.active ? { nativeMaterial: materialClock.snapshot() } : {}),
            ...(eyes ? {eyes: eyes.snapshot()} : {}),
            ...(effects ? {effects: effects.snapshot()} : {}),
            ...(wardrobe ? {wardrobe: wardrobe.snapshot()} : {}),
            spins: gestures.spins,
            polar: controls.getPolarAngle(), azimuth: controls.getAzimuthalAngle(), distance: controls.getDistance(),
            position: camera.position.toArray(), target: controls.target.toArray(),
            atRest: rest.every(item => item.object.position.distanceTo(item.position) < 1e-7
                && 1 - Math.abs(item.object.quaternion.dot(item.quaternion)) < 1e-7
                && item.object.scale.distanceTo(item.scale) < 1e-7),
        }
    }
    // Prepare the optional bundle while the existing model keeps rendering.
    // Both paths use the same material, interaction and animation setup.
    async function installModel(wardrobeBundle = false) {
        let preparing: GLTF | undefined
        let preparingEffects: Awaited<ReturnType<typeof createNativeEmitters>> | undefined
        try {
            const loaded = await loadGLB(wardrobeBundle ? ref.wardrobe! : ref, modelAbort.signal)
            preparing = loaded
            const nativeEyes = await prepareNativeEyes(loaded, modelAbort.signal)
            const nativeWardrobe = wardrobeBundle ? prepareWardrobe(loaded) : undefined
            if (wardrobeBundle && !nativeWardrobe) throw new Error('Wardrobe data is absent')
            const rig = rigMetadata(loaded)
            if (rig.key !== ref.rigKey) throw new Error('Model rig identity mismatch')
            if (loaded.animations.length) throw new Error('Static model unexpectedly contains animations')
            applyNativeDepth(loaded)
            const clock = nativeUVClock(loaded)
            const joints = [...jointObjects(loaded, rig).values()].map(object => ({
                object, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone(),
            }))
            preparingEffects = await createNativeEmitters(loaded, scene, camera)
            modelAbort.signal.throwIfAborted()
            if (wardrobeBundle) {
                stop()
                additional?.rebindParent(loaded)
                releaseModel()
                selected = undefined
                gestures.clear(true)
            }
            model = loaded
            preparing = undefined
            eyes = nativeEyes
            wardrobe = nativeWardrobe
            effects = preparingEffects
            preparingEffects = undefined
            materialClock = clock
            rest = joints
            scene.add(model.scene)
            mixer = new THREE.AnimationMixer(model.scene)
            mixer.addEventListener('finished', onFinished)
            mixer.addEventListener('loop', onLoop)
            if (!wardrobeBundle && ref.additionalActor) {
                additional = await loadAdditionalActor(ref.additionalActor, model, modelAbort.signal,
                    () => { if (state.ready) { resume(); render() } },
                    error => {
                        if (disposed) return
                        stop()
                        state.error = error instanceof Error ? error.message : String(error)
                        notify()
                        render()
                    })
                if (disposed) { additional.dispose(); return }
                scene.add(additional.group)
            }
            if (!wardrobeBundle) {
            const box = visibleBounds(model.scene)
            if (additional) box.union(visibleBounds(additional.group))
            const center = box.getCenter(new THREE.Vector3())
            const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, .001)
            const halfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * Math.min(1, camera.aspect))
            const distance = radius / Math.sin(halfFov) * 1.12
            controls.target.copy(center)
            camera.position.copy(center).add(new THREE.Vector3(.75, .35, 1.2).normalize().multiplyScalar(distance))
            camera.near = radius / 1000
            camera.far = radius * 1000
            camera.updateProjectionMatrix()
            controls.minDistance = radius * .5
            controls.maxDistance = radius * 12
            controls.update()
            initial = {position: camera.position.clone(), target: center.clone(), polar: controls.getPolarAngle()}
            controls.minPolarAngle = controls.maxPolarAngle = initial.polar
            }
            state.ready = true
            state.loading = false
            state.error = ''
            notify()
            render()
            resume()
        } catch (error) {
            if (!wardrobeBundle) { additional?.dispose(); releaseModel() }
            if (disposed || modelAbort.signal.aborted) return
            if (!wardrobeBundle) state.loading = false
            state.error = error instanceof Error ? error.message : String(error)
            notify()
        } finally {
            preparingEffects?.dispose()
            if (preparing) disposeGLTF(preparing)
        }
    }
    async function openWardrobe() {
        if (disposed || !state.ready || !ref.wardrobe || wardrobe) return
        if (wardrobeRequest) return wardrobeRequest
        state.wardrobeLoading = true
        notify()
        wardrobeRequest = installModel(true).finally(() => {
            wardrobeRequest = undefined
            state.wardrobeLoading = false
            if (!disposed) notify()
        })
        return wardrobeRequest
    }
    function changeWardrobe(change: (value: NonNullable<typeof wardrobe>) => void) {
        if (disposed || !wardrobe) return
        change(wardrobe)
        render()
        notify()
    }
    resize()
    notify()
    const ready = installModel()
    function downloadSource() {
        if (!model || !state.ready || state.wardrobeLoading) throw new Error('Model is not ready for download')
        const json = model.parser.json
        const owned = new Set<number>(Object.values(wardrobe?.profile.parts ?? {}).flatMap(part => part.meshes))
        const equipped = new Set<number>(Object.values(wardrobe?.snapshot() ?? {}).flatMap(id => wardrobe!.profile.parts[id].meshes))
        // Snapshot the outfit, not whichever eyes/props happen to be visible mid-animation.
        const visible = new Set<number>(json.nodes.flatMap((node: any, index: number) => {
            if (node.mesh === undefined) return []
            const native = node.extras?.atpNativeMeshIndex
            const shown = owned.has(native) ? equipped.has(native)
                : node.extras?.atpDefaultVisible ?? json.scenes[json.scene ?? 0].nodes.includes(index)
            return shown ? [index] : []
        }))
        return {model, visible}
    }
    return {ready, play, seek, setLoop, replay, reset, setFree, dispose, snapshot, openWardrobe, downloadSource,
        get wardrobe() { return wardrobe?.profile },
        selectPart: (id: string) => changeWardrobe(value => value.selectPart(id)),
    }
}

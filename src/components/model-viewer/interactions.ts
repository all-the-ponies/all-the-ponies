import { Box3, Mesh, Raycaster, SkinnedMesh, Sphere, Vector2, Vector3 } from 'three'
import type { Camera } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

const eyeStates = ['Open', 'Closed', 'Happy', 'Frown'] as const
type EyeState = typeof eyeStates[number] | 'None'
export type NativeEvent = {frame: number} & (
    {type: 'EyeSet', state: EyeState, enableBlink: boolean}
    | {type: 'Emitter', effect: string}
)

/** While a clip owns a mesh, only its Boolean track writes mesh.visible.
 * Eye callbacks retain expression/timer state; blinking supplies track input. */
export type NativeVisibility = {
    owns(index: number): boolean,
    blink(index: number, visible: boolean): void,
    reset(): void,
}

function check(value: unknown, message: string): asserts value {
    if (!value) throw new Error(message)
}

/** Hidden eye and SubObject nodes are outside the default glTF scene so generic readers still
 * show the static appearance. Load them explicitly, sharing the same bones.
 * Attach before material setup and bounds, and before checking cancellation so
 * the caller can release every completed dependency through disposeGLTF.
 */
export async function prepareNativeEyes(model: GLTF, signal: AbortSignal) {
    const json = model.parser.json
    const profile = json.extras?.atpInteractions
    if (profile === undefined) return undefined
    check(profile?.version === 1 && Object.keys(profile).every(key => ['version', 'eyes', 'blink', 'hiddenNodes', 'effects', 'subObjects'].includes(key)),
        'Unsupported model interaction profile')
    const hidden: number[] = profile.hiddenNodes ?? []
    check(Array.isArray(hidden) && new Set(hidden).size === hidden.length
        && hidden.every(index => Number.isSafeInteger(index) && index >= 0 && json.nodes?.[index]), 'Invalid hidden eye nodes')
    for (const index of hidden) {
        check(!json.scenes?.some((scene: any) => scene.nodes?.includes(index))
            && !json.nodes.some((node: any) => node.children?.includes(index)), 'Hidden eye node is not independent')
        signal.throwIfAborted()
        const object = await model.parser.getDependency('node', index)
        object.visible = false
        model.scene.add(object)
        signal.throwIfAborted()
    }
    const meshes = new Map<number, Mesh>()
    const defaults = new Map<Mesh, boolean>()
    model.scene.traverse(object => {
        if (!(object instanceof Mesh)) return
        const nodeIndex = model.parser.associations.get(object)?.nodes
        const node = json.nodes?.[nodeIndex]
        const index = node?.extras?.atpNativeMeshIndex
        const visible = node?.extras?.atpDefaultVisible
        check(Number.isSafeInteger(index) && index >= 0 && !meshes.has(index)
            && typeof visible === 'boolean' && (hidden.includes(nodeIndex) === !visible), 'Invalid native mesh visibility')
        meshes.set(index, object)
        defaults.set(object, visible)
        object.visible = visible
    })
    const groups = profile.eyes as Partial<Record<typeof eyeStates[number], number[]>> | undefined
    if (groups !== undefined) {
        check(groups && typeof groups === 'object' && !Array.isArray(groups)
            && Object.keys(groups).every(key => eyeStates.includes(key as typeof eyeStates[number])), 'Invalid eye groups')
        for (const indices of Object.values(groups)) check(Array.isArray(indices)
            && new Set(indices).size === indices.length && indices.every(index => meshes.has(index)), 'Invalid eye mesh reference')
    }
    const allEyes = new Set(Object.values(groups ?? {}).flat())
    const subObjects: number[] = profile.subObjects ?? []
    check(Array.isArray(subObjects) && new Set(subObjects).size === subObjects.length
        && subObjects.every(index => Number.isSafeInteger(index) && meshes.has(index)), 'Invalid SubObject mesh reference')
    const wardrobe = new Set<number>(Object.values(model.parser.json.extras?.atpWardrobe?.parts ?? {})
        .flatMap((part: {meshes: number[]}) => part.meshes))
    const controlled = new Set([...allEyes, ...subObjects, ...wardrobe])
    check(hidden.every(index => controlled.has(json.nodes[index].extras.atpNativeMeshIndex)), 'Hidden node has no native controller')
    check(groups === undefined ? profile.blink === undefined : typeof profile.blink === 'boolean',
        'Invalid source blink capability')
    // Source capability survives pruning; an empty rendered state still hides
    // the other eye groups and participates in the native blink clock.
    const canBlink = profile.blink === true
    let expression: EyeState = 'Open', enabled = true, open = false, remaining = 0
    let visibility: NativeVisibility | undefined
    function show(state: EyeState, blink = false) {
        for (const index of allEyes) {
            const visible = state !== 'None' && Boolean(groups?.[state]?.includes(index))
            if (visibility?.owns(index)) { if (blink) visibility.blink(index, visible) }
            else meshes.get(index)!.visible = visible
        }
    }
    function resetPlayback() {
        // Native reset restores the expression, without restarting the blink
        // timer/phase. Seeks and loops retain that rule but clear track overrides.
        visibility?.reset()
        for (const [index, mesh] of meshes) if (!wardrobe.has(index) && !visibility?.owns(index)) mesh.visible = defaults.get(mesh)!
        expression = 'Open'
        enabled = true
    }
    return {
        get active() { return canBlink && enabled },
        useVisibility(owner?: NativeVisibility) { visibility?.reset(); visibility = owner; visibility?.reset() },
        update(delta: number) {
            if (!canBlink || !enabled) return false
            if (remaining > 0) { remaining = Math.fround(remaining - Math.fround(delta)); return false }
            show(open ? 'Closed' : expression, true)
            remaining = open ? Math.fround(.1) : 2 + Math.floor(Math.random() * 4)
            open = !open
            return true
        },
        set(event: Extract<NativeEvent, {type: 'EyeSet'}>) {
            expression = event.state
            enabled = event.enableBlink
            show(expression)
            // The native eye setter does not restart the blink phase/timer.
        },
        resetPlayback,
        reset() {
            visibility?.reset()
            for (const [index, mesh] of meshes) if (!wardrobe.has(index)) mesh.visible = defaults.get(mesh)!
            expression = 'Open'
            enabled = true
        },
        snapshot() {
            return {canBlink, expression, enabled, open, remaining,
                visible: [...meshes].filter(([, mesh]) => mesh.visible).map(([index]) => index)}
        },
    }
}

/** A supported event profile is opt-in. Other callers (including independent
 * companions) keep rejecting eventful clips until they have a controller.
 */
export function nativeEvents(model: GLTF, events: NativeEvent[], frameCount: number, allow: boolean): NativeEvent[] {
    if (events.length === 0) return []
    check(allow, 'Animation events are not supported by this viewer')
    const profile = model.parser.json.extras?.atpInteractions
    check(profile?.version === 1, 'Model has no native interaction profile')
    let previous = -1
    for (const event of events) {
        check(event && Number.isSafeInteger(event.frame) && event.frame >= previous
            && event.frame >= 0 && event.frame < frameCount, 'Invalid native event frame')
        previous = event.frame
        if (event.type === 'EyeSet') {
            check(Object.keys(event).sort().join(',') === 'enableBlink,frame,state,type'
                && [...eyeStates, 'None'].includes(event.state) && typeof event.enableBlink === 'boolean'
                && profile.eyes && (event.state === 'None' || Array.isArray(profile.eyes[event.state])), 'Unsupported eye event')
        } else if (event.type === 'Emitter') {
            check(Object.keys(event).sort().join(',') === 'effect,frame,type'
                && typeof event.effect === 'string' && Object.prototype.hasOwnProperty.call(profile.effects ?? {}, event.effect),
            'Unresolved native emitter event')
        } else throw new Error('Unsupported native animation event')
    }
    return events.map(event => ({...event}))
}


/** Replay every crossed event in source order. A backward seek or mixer loop
 * restores defaults before reconstructing the new local time; late emitters
 * receive their age so seeking cannot leave stale effects or visibility.
 */
export function nativeEventPlayback(events: NativeEvent[], fps: number, controller: {
    reset(): void, apply(event: NativeEvent, age: number): void,
}) {
    let cursor = 0, previous = -1, previousCycle = 0
    function reset() {
        controller.reset()
        cursor = 0
        previous = -1
        previousCycle = 0
    }
    return {
        reset,
        update(time: number, cycle = 0) {
            check(Number.isFinite(time) && time >= 0 && Number.isSafeInteger(cycle) && cycle >= 0,
                'Invalid native event playback time')
            if (time < previous || cycle !== previousCycle) reset()
            previous = time
            previousCycle = cycle
            while (cursor < events.length && events[cursor].frame / fps <= time) {
                const event = events[cursor++]
                controller.apply(event, Math.max(0, time - event.frame / fps))
            }
        },
    }
}

/** Test the current skinned pose, never rest-pose bounds or companion meshes. */
export function hitsModel(model: GLTF, camera: Camera, canvas: HTMLCanvasElement, event: Pick<PointerEvent, 'clientX' | 'clientY'>) {
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0 || event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom) return false
    camera.updateMatrixWorld(true)
    model.scene.updateMatrixWorld(true)
    const meshes: Mesh[] = []
    model.scene.traverseVisible(object => {
        if (!(object instanceof Mesh)) return
        if (object instanceof SkinnedMesh) updateSkinnedBounds(object)
        meshes.push(object)
    })
    const ray = new Raycaster()
    ray.setFromCamera(new Vector2((event.clientX - rect.left) / rect.width * 2 - 1,
        1 - (event.clientY - rect.top) / rect.height * 2), camera)
    return ray.intersectObjects(meshes, false).length > 0
}

// Wardrobe meshes share position buffers; only their indexed vertices belong to these bounds.
function updateSkinnedBounds(mesh: SkinnedMesh) {
    const box = mesh.boundingBox ??= new Box3()
    box.makeEmpty()
    const point = new Vector3()
    const indices = mesh.geometry.index
    const used = new Set<number>()
    for (let i = 0; i < (indices?.count ?? mesh.geometry.attributes.position.count); i++) {
        used.add(indices ? indices.getX(i) : i)
    }
    for (const index of used) box.expandByPoint(mesh.getVertexPosition(index, point))
    box.getBoundingSphere(mesh.boundingSphere ??= new Sphere())
}

/** Book uses signed horizontal displacement modulo one turn. Four releases
 * strictly over 220 degrees trigger defeat; returning to the start is not a tap.
 */
export function nativeGestures() {
    const pointers = new Map<number, {x: number, startX: number, startY: number, moved: boolean, angle: number, rotating: boolean, multiple: boolean}>()
    let spins = 0
    function move(event: PointerEvent, height: number, speed: number) {
        const pointer = pointers.get(event.pointerId)
        if (!pointer) return
        if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 4) pointer.moved = true
        const x = event.pointerType === 'touch' ? event.pageX : event.clientX
        if (pointer.rotating && !pointer.multiple && Number.isFinite(x) && Number.isFinite(pointer.x))
            pointer.angle += (x - pointer.x) * 360 * speed / Math.max(1, height)
        pointer.x = x
    }
    return {
        down(event: PointerEvent, enabled: boolean) {
            for (const pointer of pointers.values()) pointer.multiple = true
            const touch = event.pointerType === 'touch'
            pointers.set(event.pointerId, {x: touch ? event.pageX : event.clientX,
                startX: event.clientX, startY: event.clientY, moved: false, angle: 0,
                rotating: enabled && (touch || event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey),
                multiple: pointers.size > 0})
        },
        move,
        up(event: PointerEvent, height: number, speed: number, enabled: boolean): 'click' | 'dizzy' | undefined {
            const pointer = pointers.get(event.pointerId)
            move(event, height, speed) // Include the final pointerup displacement.
            pointers.delete(event.pointerId)
            if (!pointer || event.type === 'pointercancel' || !enabled || !pointer.rotating || pointer.multiple) return
            if (!pointer.moved) return 'click'
            if (Math.abs(pointer.angle % 360) > 220 && ++spins >= 4) { spins = 0; return 'dizzy' }
        },
        clear(resetSpins = false) { pointers.clear(); if (resetSpins) spins = 0 },
        get spins() { return spins },
    }
}

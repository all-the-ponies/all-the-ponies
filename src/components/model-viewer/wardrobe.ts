import { Mesh } from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

export const wardrobeSlots = ['Body', 'Mane', 'Tail'] as const
export type WardrobeSlot = typeof wardrobeSlots[number]
type Selection = Record<WardrobeSlot, string>
export type WardrobeProfile = {
    version: 1,
    defaults: Selection,
    sets: Record<string, Partial<Selection>>,
    parts: Record<string, {slot: WardrobeSlot, meshes: number[], linked?: string}>,
}

function check(value: unknown, message: string): asserts value {
    if (!value) throw new Error(message)
}
const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)

/** Called after hidden native nodes have joined the scene. Each wardrobe mesh
 * has one writer; eyes and animation SubObjects retain their own controllers. */
export function prepareWardrobe(model: GLTF) {
    const json = model.parser.json
    const profile = json.extras?.atpWardrobe as WardrobeProfile | undefined
    if (profile === undefined) return undefined
    check(record(profile) && profile.version === 1 && record(profile.defaults)
        && Object.keys(profile.defaults).every(slot => wardrobeSlots.includes(slot as WardrobeSlot))
        && record(profile.sets) && record(profile.parts), 'Unsupported wardrobe profile')
    const parts = profile.parts
    for (const [id, part] of Object.entries(parts)) {
        check(id.length > 0 && record(part) && wardrobeSlots.includes(part.slot)
            && Array.isArray(part.meshes) && new Set(part.meshes).size === part.meshes.length
            && part.meshes.every(index => Number.isSafeInteger(index) && index >= 0), 'Invalid wardrobe part meshes')
        if (part.linked !== undefined) check(typeof part.linked === 'string' && owns(parts, part.linked)
            && parts[part.linked].slot !== part.slot && parts[part.linked].linked === undefined,
            'Invalid wardrobe linked part')
    }
    const direct = new Set<string>()
    for (const [id, set] of Object.entries(profile.sets)) {
        check(id.length > 0 && record(set) && Object.keys(set).length > 0
            && Object.keys(set).every(slot => wardrobeSlots.includes(slot as WardrobeSlot)), 'Invalid wardrobe set')
        for (const slot of wardrobeSlots) if (set[slot] !== undefined) {
            const id = set[slot]!
            check(typeof id === 'string' && owns(parts, id) && parts[id].slot === slot, 'Invalid wardrobe set part')
            direct.add(id)
        }
    }
    for (const slot of wardrobeSlots) {
        const id = profile.defaults[slot]
        check(typeof id === 'string' && direct.has(id) && parts[id].slot === slot, 'Invalid wardrobe default part')
    }
    const meshes = new Map<number, Mesh>()
    model.scene.traverse(object => {
        if (!(object instanceof Mesh)) return
        const nodeIndex = model.parser.associations.get(object)?.nodes
        const index = nodeIndex === undefined ? undefined : json.nodes?.[nodeIndex]?.extras?.atpNativeMeshIndex
        check(Number.isSafeInteger(index) && index >= 0 && !meshes.has(index), 'Invalid wardrobe native mesh identity')
        meshes.set(index, object)
    })
    const interactions = json.extras?.atpInteractions
    const controlled = new Set<number>([
        ...Object.values(interactions?.eyes ?? {}).flat() as number[], ...interactions?.subObjects ?? [],
    ])
    const meshOwners = new Map<Mesh, Set<string>>()
    for (const [id, part] of Object.entries(parts)) for (const index of part.meshes) {
        check(meshes.has(index), 'Missing wardrobe native mesh')
        check(!controlled.has(index), 'Wardrobe mesh overlaps a native controller')
        const mesh = meshes.get(index)!
        if (!meshOwners.has(mesh)) meshOwners.set(mesh, new Set())
        meshOwners.get(mesh)!.add(id)
    }
    // Pony viewers enter this bundle at its default appearance. Keep a distinct
    // snapshot: native repeat-selection/linked cleanup refer to entry state.
    const defaults = {...profile.defaults}, entry = {...defaults}
    const selected = {...entry}
    function apply() {
        for (const [mesh, owners] of meshOwners) mesh.visible = wardrobeSlots.some(slot => owners.has(selected[slot]))
    }
    function replace(id: string) {
        const part = parts[id], old = parts[selected[part.slot]]
        if (old.linked) {
            const slot = parts[old.linked].slot
            replace(entry[slot] === old.linked ? defaults[slot] : entry[slot])
        }
        selected[part.slot] = id
        if (part.linked) selected[parts[part.linked].slot] = part.linked
    }
    apply()
    return {
        profile,
        selectPart(id: string) {
            check(direct.has(id), 'Part is not directly selectable in this wardrobe')
            const slot = parts[id].slot
            replace(selected[slot] === id ? entry[slot] : id)
            apply()
        },
        snapshot: (): Selection => ({...selected}),
    }
}

import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { bindAnimation, jointObjects, rigMetadata } from './animation'
import { disposeGLTF, loadGLB, type AdditionalActorRef, type AnimationRef, type VisibilityCurve } from './assets'

// Export the validated ATP profile from source data, never from the current
// animated pose or renderer materials. Textures keep their original bytes.
type Json = Record<string, any>
const widths: Record<string, number> = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16}
const arrays: Record<number, any> = {5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array}


function packGLB(document: Json, chunks: Uint8Array[], binaryLength: number) {
    const json = new TextEncoder().encode(JSON.stringify(document))
    const size = Math.ceil(json.length / 4) * 4, binSize = Math.ceil(binaryLength / 4) * 4
    const output = new ArrayBuffer(28 + size + binSize), view = new DataView(output), bytes = new Uint8Array(output)
    view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, output.byteLength, true)
    view.setUint32(12, size, true); view.setUint32(16, 0x4e4f534a, true)
    bytes.fill(32, 20, 20 + size); bytes.set(json, 20)
    view.setUint32(20 + size, binSize, true); view.setUint32(24 + size, 0x004e4942, true)
    let offset = 28 + size
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    return output
}

export async function downloadModel(model: GLTF, visibleNodes: ReadonlySet<number>, refs: AnimationRef[],
    signal: AbortSignal, progress: (completed: number, total: number) => void, companion?: AdditionalActorRef) {
    const out: Json = {asset: {version: '2.0', generator: 'ATP model download'}, scene: 0, scenes: [{nodes: []}],
        nodes: [], meshes: [], skins: [], materials: [], textures: [], images: [], samplers: [], accessors: [], bufferViews: [], buffers: []}
    const chunks: Uint8Array[] = []
    let length = 0
    function bufferView(bytes: Uint8Array) {
        const aligned = Math.ceil(length / 4) * 4
        if (aligned > length) chunks.push(new Uint8Array(aligned - length))
        const index = out.bufferViews.length
        out.bufferViews.push({buffer: 0, byteOffset: aligned, byteLength: bytes.byteLength})
        chunks.push(bytes); length = aligned + bytes.byteLength
        return index
    }
    function accessor(values: ArrayBufferView, type: string, componentType = 5126, bounded = false, normalized = false) {
        const index = out.accessors.length, row: Json = {bufferView: bufferView(new Uint8Array(values.buffer, values.byteOffset, values.byteLength)),
            componentType, count: (values as any).length / widths[type], type}
        if (normalized) row.normalized = true
        if (bounded) {
            row.min = Array(widths[type]).fill(Infinity); row.max = Array(widths[type]).fill(-Infinity)
            for (let i = 0; i < (values as any).length; i++) {
                const k = i % widths[type], value = (values as any)[i]
                row.min[k] = Math.min(row.min[k], value); row.max[k] = Math.max(row.max[k], value)
            }
        }
        out.accessors.push(row); return index
    }
    let completed = 0
    const total = new Set(refs.map(ref => ref.id)).size + new Set(companion?.model.animations.map(ref => ref.id)).size
    progress(0, total)
    // Each source has its own indices and rig; only the output buffer is shared.
    async function appendActor(model: GLTF, visibleNodes: ReadonlySet<number>, refs: AnimationRef[],
        prefix = '', transform?: number[]) {
        const source = model.parser.json, rig = rigMetadata(model)
        const binary: ArrayBuffer = await model.parser.getDependency('buffer', 0)
        signal.throwIfAborted()
        function sourceArray(index: number) {
            const row = source.accessors[index], view = source.bufferViews[row.bufferView], Type = arrays[row.componentType]
            if (!Type || row.sparse || !widths[row.type]) throw new Error('Unsupported model accessor')
            const width = widths[row.type], stride = view.byteStride ?? width * Type.BYTES_PER_ELEMENT
            const values = new Type(row.count * width), offset = (view.byteOffset ?? 0) + (row.byteOffset ?? 0)
            for (let i = 0; i < row.count; i++) values.set(new Type(binary, offset + i * stride, width), i * width)
            return values
        }
        // Keep original skeleton indices internally; all mesh nodes are appended.
        const nodes = [0, ...rig.jointNodes], nodeMap = new Map(nodes.map((id, index) => [id, out.nodes.length + index]))
        for (const id of nodes) {
            const node = structuredClone(source.nodes[id]); delete node.extras; delete node.isBone
            if (node.children) node.children = node.children.filter((child: number) => nodeMap.has(child)).map((child: number) => nodeMap.get(child))
            out.nodes.push(node)
        }
        const actorRoot = nodeMap.get(0)!, roots = [actorRoot]
        const boneByUUID = new Map([...jointObjects(model)].map(([id, object]) => [object.uuid, id]))
        // Native names can identify multiple submeshes; retain every target.
        const meshNodesByName = new Map<string, number[]>()
        source.nodes.forEach((node: Json, index: number) => {
            if (node.mesh === undefined) return
            const name = source.meshes[node.mesh].name
            if (!meshNodesByName.has(name)) meshNodesByName.set(name, [])
            meshNodesByName.get(name)!.push(index)
        })
        const clips: {animation: Json, curves: Map<number, VisibilityCurve>}[] = []
        const selected = new Map(refs.map(ref => [ref.id, ref]))
        for (const ref of selected.values()) {
            signal.throwIfAborted()
            const loaded = await loadGLB(ref, signal)
            try {
                const clip = await bindAnimation(model, loaded, ref, true)
                const native = loaded.parser.json.extras.atpClip.nativeSampling !== undefined
                const tracks = clip.tracks.filter(track => boneByUUID.has(track.name.split('.')[0]))
                const animation: Json = {name: prefix + ref.id, channels: [], samplers: []}
                const add = (track: typeof tracks[number], times: Float32Array, values: Float32Array, interpolation: string, timeAccessor?: number) => {
                    const [uuid, property] = track.name.split('.'), joint = boneByUUID.get(uuid)!
                    animation.channels.push({sampler: animation.samplers.length, target: {node: nodeMap.get(joint), path: property === 'position' ? 'translation' : 'rotation'}})
                    animation.samplers.push({input: timeAccessor ?? accessor(times, 'SCALAR', 5126, true),
                        output: accessor(values, property === 'position' ? 'VEC3' : 'VEC4'), interpolation})
                }
                if (native) {
                    const count = Math.max(1, Math.ceil(clip.duration * 60))
                    const times = Float32Array.from({length: count + 1}, (_, i) => i * clip.duration / count)
                    const timeAccessor = accessor(times, 'SCALAR', 5126, true)
                    const samples = tracks.map(track => ({track, interpolant: (track as typeof track & {createInterpolant(): {evaluate(time: number): ArrayLike<number>}}).createInterpolant(), values: new Float32Array(times.length * track.getValueSize())}))
                    // Time outside / tracks inside: native model-space pose is calculated once per sample.
                    for (let i = 0; i < times.length; i++) {
                        for (const {track, interpolant, values} of samples) values.set(interpolant.evaluate(times[i]), i * track.getValueSize())
                        if (i % 240 === 0) { await new Promise(resolve => setTimeout(resolve, 0)); signal.throwIfAborted() }
                    }
                    for (const {track, values} of samples) add(track, times, values, 'LINEAR', timeAccessor)
                } else {
                    // Ordinary source tracks already encode the intended STEP motion.
                    for (const track of tracks) add(track, new Float32Array(track.times), new Float32Array(track.values as ArrayLike<number>), 'STEP')
                }
                // The bound clip shares the same named, seconds-based visibility
                // data with preview. Only glTF channel targets need node indices.
                const curves = new Map<number, VisibilityCurve>()
                for (const curve of clip.visibility) {
                    for (const id of meshNodesByName.get(curve.meshName)!) curves.set(id, curve)
                }
                clips.push({animation, curves})
            } finally { disposeGLTF(loaded) }
            progress(++completed, total)
            await new Promise(resolve => setTimeout(resolve, 0))
        }
        signal.throwIfAborted()
        const included = new Set(visibleNodes)
        for (const {curves} of clips) for (const [id, curve] of curves) if (curve.values.some(Boolean)) included.add(id)
        const meshNodes = [...included].filter(id => source.nodes[id]?.mesh !== undefined)
        // Repack only referenced vertices. Wardrobe bundles share one attribute table
        // across every outfit, so simply deleting mesh nodes would retain unused clothing.
        const geometryGroups = new Map<string, {attributes: Record<string, number>, vertices: Map<number, number>, primitives: {primitive: Json, output: Json}[]}>()
        const materialMap = new Map<number, number>(), textureMap = new Map<number, number>(), imageMap = new Map<number, number>(), samplerMap = new Map<number, number>()
        const vertexAlphaMaterials = new Set<number>()
        function texture(index: number) {
            if (textureMap.has(index)) return textureMap.get(index)!
            const row = structuredClone(source.textures[index]), result = out.textures.length
            textureMap.set(index, result); out.textures.push(row)
            if (!imageMap.has(row.source)) {
                const image = structuredClone(source.images[row.source]), view = source.bufferViews[image.bufferView]
                image.bufferView = bufferView(new Uint8Array(binary, view.byteOffset ?? 0, view.byteLength))
                imageMap.set(row.source, out.images.length); out.images.push(image)
            }
            row.source = imageMap.get(row.source)
            if (row.sampler !== undefined) {
                if (!samplerMap.has(row.sampler)) {samplerMap.set(row.sampler, out.samplers.length); out.samplers.push(structuredClone(source.samplers[row.sampler]))}
                row.sampler = samplerMap.get(row.sampler)
            }
            return result
        }
        function material(index: number) {
            if (materialMap.has(index)) return materialMap.get(index)!
            const row = structuredClone(source.materials[index]), result = out.materials.length
            delete row.extras
            for (const info of [row.pbrMetallicRoughness?.baseColorTexture, row.pbrMetallicRoughness?.metallicRoughnessTexture,
                row.normalTexture, row.occlusionTexture, row.emissiveTexture]) if (info) info.index = texture(info.index)
            materialMap.set(index, result); out.materials.push(row); return result
        }
        const skinMap = new Map<number, number>()
        function skin(index: number) {
            if (skinMap.has(index)) return skinMap.get(index)!
            const row = structuredClone(source.skins[index]), result = out.skins.length
            row.joints = row.joints.map((id: number) => nodeMap.get(id))
            if (row.skeleton !== undefined) row.skeleton = nodeMap.get(row.skeleton)
            row.inverseBindMatrices = accessor(sourceArray(row.inverseBindMatrices), 'MAT4')
            skinMap.set(index, result); out.skins.push(row); return result
        }
        for (const id of meshNodes) {
            const node = structuredClone(source.nodes[id]), mesh = structuredClone(source.meshes[node.mesh])
            delete mesh.isSkinnedMesh
            node.name = mesh.name
            delete node.extras; delete node.isBone; delete node.children
            nodeMap.set(id, out.nodes.length); out.nodes.push(node); roots.push(nodeMap.get(id)!)
            node.mesh = out.meshes.length; out.meshes.push(mesh)
            if (node.skin !== undefined) node.skin = skin(node.skin)
            for (const primitive of mesh.primitives) {
                if (primitive.indices === undefined || primitive.targets || (primitive.mode ?? 4) !== 4) throw new Error('Unsupported model geometry')
                const key = JSON.stringify(primitive.attributes)
                if (!geometryGroups.has(key)) geometryGroups.set(key, {attributes: primitive.attributes, vertices: new Map(), primitives: []})
                const group = geometryGroups.get(key)!, original = structuredClone(primitive)
                for (const index of sourceArray(original.indices)) if (!group.vertices.has(index)) group.vertices.set(index, group.vertices.size)
                group.primitives.push({primitive: original, output: primitive})
                if (primitive.material !== undefined) {
                    if (source.accessors[primitive.attributes.COLOR_0]?.type === 'VEC4') vertexAlphaMaterials.add(primitive.material)
                    primitive.material = material(primitive.material)
                }
                delete primitive.extras
            }
        }
        // Preserve custom native skin attributes alongside the standard glTF carrier.
        for (const group of geometryGroups.values()) {
            const attributes: Record<string, number> = {}
            for (const [semantic, index] of Object.entries(group.attributes)) {
                const row = source.accessors[index], input = sourceArray(index), width = widths[row.type], Type = arrays[row.componentType]
                const values = new Type(group.vertices.size * width)
                for (const [old, next] of group.vertices) values.set(input.subarray(old * width, (old + 1) * width), next * width)
                attributes[semantic] = accessor(values, row.type, row.componentType, semantic === 'POSITION', row.normalized)
            }
            for (const {primitive, output} of group.primitives) {
                const Type = group.vertices.size >= 65536 ? Uint32Array : Uint16Array
                output.attributes = attributes
                output.indices = accessor(new Type(Array.from(sourceArray(primitive.indices), (id: number) => group.vertices.get(id)!)), 'SCALAR', Type === Uint32Array ? 5125 : 5123)
            }
        }
        // Classify only download copies. Mixed atlases and RGBA vertex colors keep
        // BLEND; every copied texture still uses the original embedded image bytes.
        const opaqueImages = new Map<number, boolean>()
        for (const [original, index] of materialMap) {
            const row = out.materials[index]
            if (row.alphaMode !== 'BLEND' || (row.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1) !== 1
                || vertexAlphaMaterials.has(original)) continue
            const textureIndex = source.materials[original].pbrMetallicRoughness?.baseColorTexture?.index
            if (textureIndex !== undefined) {
                const imageIndex = source.textures[textureIndex].source
                if (!opaqueImages.has(imageIndex)) {
                    const image = source.images[imageIndex], view = source.bufferViews[image.bufferView]
                    const bytes = new Uint8Array(binary, view.byteOffset ?? 0, view.byteLength)
                    // Preview may dispose its ImageBitmap while animations are loading.
                    // Decode our embedded source bytes and own this bitmap's lifetime.
                    let bitmap: ImageBitmap | undefined
                    let opaque = false
                    try {
                        bitmap = await createImageBitmap(new Blob([bytes], {type: image.mimeType}), {premultiplyAlpha: 'none'})
                        const canvas = document.createElement('canvas')
                        canvas.width = bitmap.width; canvas.height = bitmap.height
                        const context = canvas.getContext('2d')!
                        context.drawImage(bitmap, 0, 0)
                        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
                        opaque = true
                        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] !== 255) { opaque = false; break }
                    } catch {
                        // An unreadable image cannot establish opacity; keep BLEND.
                    } finally { bitmap?.close() }
                    signal.throwIfAborted()
                    opaqueImages.set(imageIndex, opaque)
                }
                if (!opaqueImages.get(imageIndex)) continue
            }
            row.alphaMode = 'OPAQUE'
        }
        // Each independently visible skinned part receives a private skeleton branch.
        // Scaling the branch collapses all its triangles, while its mesh stays outside
        // the branch (no singular mesh transform or effect on the shared body rig).
        // Joint animation samplers are reused, not re-baked per visibility branch.
        for (const id of meshNodes) {
            if (!clips.some(clip => clip.curves.has(id))) continue
            const node = out.nodes[nodeMap.get(id)!], root = out.nodes.length
            const defaults = visibleNodes.has(id)
            out.nodes.push({name: `Visibility_${id}`, scale: defaults ? [1, 1, 1] : [0, 0, 0], children: []})
            out.nodes[actorRoot].children ??= []; out.nodes[actorRoot].children.push(root)
            if (node.skin !== undefined) {
                const original = out.skins[node.skin], cloneMap = new Map<number, number>()
                for (const joint of rig.jointNodes.map(id => nodeMap.get(id)!)) {
                    cloneMap.set(joint, out.nodes.length)
                    out.nodes.push({...structuredClone(out.nodes[joint]), name: `${out.nodes[joint].name}_visibility_${id}`})
                }
                for (const [joint, clone] of cloneMap) if (out.nodes[joint].children)
                    out.nodes[clone].children = out.nodes[joint].children.map((child: number) => cloneMap.get(child))
                out.nodes[root].children = source.nodes[0].children.map((child: number) => cloneMap.get(nodeMap.get(child)!))
                node.skin = out.skins.length
                // A common nonzero skeleton root lets Blender create visibility
                // parents as bones, instead of zero-scale armature objects.
                out.skins.push({...original, skeleton: actorRoot, joints: original.joints.map((joint: number) => cloneMap.get(joint))})
                for (const {animation} of clips) {
                    const channels = animation.channels.filter((channel: Json) => cloneMap.has(channel.target.node))
                    for (const channel of channels) animation.channels.push({...channel, target: {...channel.target, node: cloneMap.get(channel.target.node)}})
                }
            } else {
                // Rigid objects can use a parent directly. They are scene roots in the ATP profile.
                out.nodes[actorRoot].children.pop()
                roots.splice(roots.indexOf(nodeMap.get(id)!), 1, root)
                out.nodes[root].children = [nodeMap.get(id)]
            }
            for (const {animation, curves} of clips) {
                const curve = curves.get(id) ?? {times: [0], values: [defaults]}
                const values = Float32Array.from(curve.values.flatMap(value => value ? [1, 1, 1] : [0, 0, 0]))
                animation.channels.push({sampler: animation.samplers.length, target: {node: root, path: 'scale'}})
                animation.samplers.push({input: accessor(new Float32Array(curve.times), 'SCALAR', 5126, true), output: accessor(values, 'VEC3'), interpolation: 'STEP'})
            }
        }
        if (clips.length) (out.animations ??= []).push(...clips.map(clip => clip.animation))
        if (source.extensionsUsed) out.extensionsUsed = [...new Set([...(out.extensionsUsed ?? []), ...source.extensionsUsed])]
        if (transform) {
            out.scenes[0].nodes.push(out.nodes.length)
            out.nodes.push({name: 'Companion', matrix: [...transform], children: roots})
        } else out.scenes[0].nodes.push(...roots)
    }
    await appendActor(model, visibleNodes, refs, companion ? 'pony/' : '')
    if (companion) {
        const loaded = await loadGLB(companion.model, signal)
        try {
            const json = loaded.parser.json
            const visible = new Set<number>(json.nodes.flatMap((node: Json, index: number) =>
                node.mesh !== undefined && (node.extras?.atpDefaultVisible ?? json.scenes[json.scene ?? 0].nodes.includes(index)) ? [index] : []))
            await appendActor(loaded, visible, companion.model.animations, 'companion/', companion.transform)
        } finally { disposeGLTF(loaded) }
    }
    out.buffers.push({byteLength: length})
    for (const key of ['skins', 'materials', 'textures', 'images', 'samplers']) if (!out[key].length) delete out[key]
    signal.throwIfAborted()
    return packGLB(out, chunks, length)
}

import * as THREE from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

export type NativeEmitterProfile = {
    version: 1, coordinateSpace: 'native-world-2d', anchor: 'model-origin', texture: number,
    particle: {
        rate: -1, count: number, lifetime: number, timeWarp: number, speed: number,
        force: number[], uv: number[], min: number[][], max: number[][],
        portions: number[], positionModes: number[], blend: 'add',
    },
}
const vector = (value: unknown, count: number): value is number[] => Array.isArray(value) &&
    value.length === count && value.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 4096)
const keys = (value: unknown, expected: string[]) => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === expected.sort().join(',')

export function validateNativeEmitter(value: unknown): NativeEmitterProfile {
    const d = value as NativeEmitterProfile
    const p = d?.particle
    if (!keys(d, ['version', 'coordinateSpace', 'anchor', 'texture', 'particle']) || d.version !== 1 ||
        d.coordinateSpace !== 'native-world-2d' || d.anchor !== 'model-origin' ||
        !Number.isInteger(d.texture) || d.texture < 0 ||
        !keys(p, ['rate', 'count', 'lifetime', 'timeWarp', 'speed', 'force', 'uv', 'min', 'max', 'portions', 'positionModes', 'blend'])) {
        throw new Error('Unsupported native emitter profile')
    }
    if (p.rate !== -1 || !Number.isInteger(p.count) || p.count <= 0 || p.count > 128 ||
        !Number.isFinite(p.lifetime) || p.lifetime <= 0 || p.lifetime > 10 ||
        !Number.isFinite(p.timeWarp) || p.timeWarp <= 0 || p.timeWarp > 4 ||
        !Number.isFinite(p.speed) || p.speed <= 0 || p.speed > 4 || p.blend !== 'add' ||
        !vector(p.force, 4) || p.force.some(n => n !== 0) ||
        !vector(p.uv, 4) || p.uv.some(n => n < 0 || n > 1) || p.uv[0]! >= p.uv[2]! || p.uv[1]! >= p.uv[3]! ||
        !vector(p.portions, 3) || p.portions[0] !== 0 || p.portions.slice(1).some(n => n <= 0) ||
        !vector(p.positionModes, 3) || p.positionModes.join(',') !== '5,6,6' ||
        ![p.min, p.max].every(rows => Array.isArray(rows) && rows.length === 3 && rows.every(row =>
            vector(row, 10) && row[2] === 0 && row.slice(4, 8).every(n => n >= 0 && n <= 1) && row.slice(8).every(n => n > 0))) ||
        p.min.some((row, i) => row.some((n, j) => n > p.max[i]![j]!))) {
        throw new Error('Unsupported native emitter values')
    }
    return d
}

type Particle = { age: number, segment: number, segmentAge: number, durations: number[],
    targets: number[][], deltas: number[][], value: number[] }

/** Native finite burst only: reviewed disk/ring distribution and weighted segments.
 * These angles are float32 constants from the native particle controller, not
 * values inferred from model geometry. Consume Time's draw even for equal bounds.
 */
export function createEmitterSimulation(definition: NativeEmitterProfile, random = Math.random) {
    const p = validateNativeEmitter(definition).particle
    let active = false
    let emitted = false
    let particles: Particle[] = []
    function sample(index: number, ordinal: number) {
        const low = p.min[index]!, high = p.max[index]!
        const angle = index === 0 ? ordinal * 2.4000000953674316 :
            ordinal * 6.2831854820251465 / p.count - 2.356194496154785
        const radius = index === 0 ? Math.sqrt(ordinal + .5) / Math.sqrt(p.count - .5) : 1
        const row = [(low[0]! + high[0]!) / 2 + (high[0]! - low[0]!) / 2 * radius * Math.cos(angle),
            (low[1]! + high[1]!) / 2 + (high[1]! - low[1]!) / 2 * radius * Math.sin(angle), 0]
        for (let i = 3; i < 10; i++) row.push(low[i]! + (high[i]! - low[i]!) * random())
        random()
        return row
    }
    function reset() { active = false; emitted = false; particles = [] }
    function emit() {
        const total = p.portions[1]! + p.portions[2]!
        for (let index = 0; index < p.count; index++) {
            // Native burst consumes slot zero, then remaining slots backwards.
            const ordinal = index ? p.count - index : 0
            const targets = [0, 1, 2].map(i => sample(i, ordinal))
            particles.push({age: 0, segment: 0, segmentAge: 0,
                targets, durations: p.portions.slice(1).map(n => p.lifetime * n / total),
                deltas: targets.slice(1).map((row, i) => row.map((n, j) => (n - targets[i]![j]!) * (j < 3 ? p.speed : 1))),
                value: targets[0]!.slice()})
        }
        emitted = true
    }
    function update(delta: number) {
        if (!Number.isFinite(delta) || delta < 0) throw new Error('Invalid native emitter delta')
        if (!active) return
        const step = delta * p.timeWarp
        for (const particle of particles) {
            particle.age += step
            let remaining = step
            while (remaining > 1e-10 && particle.segment < 2) {
                const duration = particle.durations[particle.segment]!
                const take = Math.min(remaining, duration - particle.segmentAge)
                const change = particle.deltas[particle.segment]!
                for (let i = 0; i < 10; i++) particle.value[i]! += change[i]! * take / duration
                particle.segmentAge += take
                remaining -= take
                if (particle.segmentAge >= duration - 1e-10) { particle.segment++; particle.segmentAge = 0 }
            }
        }
        particles = particles.filter(row => row.age < p.lifetime - 1e-10)
        if (!emitted && delta > 0) emit()
        if (emitted && !particles.length) active = false
    }
    return {
        trigger(elapsed = 0) {
            if (!Number.isFinite(elapsed) || elapsed < 0) throw new Error('Invalid native emitter catch-up')
            reset(); active = true
            // On-time native bursts still emit on their first positive tick.
            // A late event starts at its event time, then advances by its real
            // elapsed age; no invented tick or epsilon is added to the clock.
            if (elapsed > 0) { emit(); update(elapsed) }
        },
        update,
        reset,
        get active() { return active },
        snapshot() { return {active, emitted, particles} },
    }
}

/** Release effect-only texture dependencies, which are absent from glTF scenes. */
export async function createNativeEmitters(gltf: GLTF, scene: THREE.Scene, camera: THREE.Camera) {
    const definitions = gltf.parser.json.extras?.atpInteractions?.effects ?? {}
    if (typeof definitions !== 'object' || definitions === null || Array.isArray(definitions)) throw new Error('Invalid native emitters')
    const profiles = Object.entries(definitions).map(([name, value]) => {
        if (name !== 'mlp_arena_pony_defeat_02') throw new Error('Unsupported native emitter identity')
        return [name, validateNativeEmitter(value)] as const
    })
    // This implementation handles this one verified local event, not arbitrary
    // scene callbacks, sound, flying particles or a general effects catalogue.
    const textures = new Map<string, THREE.Texture>()
    const loadedTextures = new Set<THREE.Texture>()
    const sharedTextures = new Set<THREE.Texture>()
    for (const modelScene of gltf.scenes) modelScene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        for (const material of [object.material].flat()) for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) sharedTextures.add(value)
        }
    })
    function disposeTextures() {
        const sharedImages = new Set([...sharedTextures].map(texture => texture.source.data))
        const closed = new Set<unknown>()
        for (const texture of new Set([...loadedTextures, ...textures.values()])) if (!sharedTextures.has(texture)) {
            texture.dispose()
            const image = texture.source.data as {close?: () => void} | null
            if (!sharedImages.has(image) && !closed.has(image) && typeof image?.close === 'function') { image.close(); closed.add(image) }
        }
        textures.clear(); loadedTextures.clear()
    }
    try {
    for (const [name, profile] of profiles) {
        const image = gltf.parser.json.images?.[gltf.parser.json.textures?.[profile.texture]?.source]
        if (!image || image.mimeType !== 'image/png' || !Number.isInteger(image.bufferView) || image.uri !== undefined) {
            throw new Error('Native emitter requires an embedded PNG')
        }
        const texture = await gltf.parser.getDependency('texture', profile.texture)
        if (!(texture instanceof THREE.Texture)) throw new Error('Missing native emitter texture')
        loadedTextures.add(texture)
        // Effect-only textures have no glTF material to assign their colour space.
        // Clone so shared material state cannot be changed by this renderer.
        const particleTexture = texture.clone()
        particleTexture.flipY = false
        particleTexture.colorSpace = THREE.SRGBColorSpace
        particleTexture.minFilter = particleTexture.magFilter = THREE.LinearFilter
        particleTexture.wrapS = particleTexture.wrapT = THREE.RepeatWrapping
        particleTexture.generateMipmaps = false
        particleTexture.needsUpdate = true
        textures.set(name, particleTexture)
    }
    } catch (error) { disposeTextures(); throw error }
    const scale = gltf.parser.json.nodes?.[0]?.scale ?? [1, 1, 1]
    if (!vector(scale, 3) || scale[0] <= 0 || scale.some(n => n !== scale[0])) { disposeTextures(); throw new Error('Invalid native emitter model scale') }
    type Instance = {name: string, simulation: ReturnType<typeof createEmitterSimulation>, group: THREE.Group, meshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[]}
    const instances: Instance[] = []
    let disposed = false
    function clear() {
        for (const instance of instances) {
            instance.simulation.reset()
            instance.group.removeFromParent()
            for (const mesh of instance.meshes) { mesh.geometry.dispose(); mesh.material.dispose() }
        }
        instances.length = 0
    }
    function render() {
        if (disposed) return
        gltf.scene.updateMatrixWorld(true)
        for (const instance of instances) {
            const profile = definitions[instance.name] as NativeEmitterProfile
            instance.group.position.setFromMatrixPosition(gltf.scene.matrixWorld)
            camera.getWorldQuaternion(instance.group.quaternion)
            instance.group.scale.setScalar(scale[0]!)
            instance.simulation.snapshot().particles.forEach((particle, i) => {
                const v = particle.value, mesh = instance.meshes[i]!
                mesh.visible = true
                mesh.position.set(v[0]!, -v[1]!, 0)
                mesh.scale.set(v[8]!, v[9]!, 1)
                mesh.rotation.z = -v[3]! * Math.PI / 180
                mesh.material.color.setRGB(v[4]!, v[5]!, v[6]!, THREE.SRGBColorSpace)
                mesh.material.opacity = v[7]!
                const uv = profile.particle.uv, attr = mesh.geometry.attributes.uv!
                attr.setXY(0, uv[0]!, uv[1]!); attr.setXY(1, uv[2]!, uv[1]!)
                attr.setXY(2, uv[0]!, uv[3]!); attr.setXY(3, uv[2]!, uv[3]!)
                attr.needsUpdate = true
            })
            const count = instance.simulation.snapshot().particles.length
            instance.meshes.slice(count).forEach(mesh => { mesh.visible = false })
            instance.group.updateMatrixWorld(true)
        }
    }
    return {
        trigger(name: string, elapsed = 0) {
            if (!Number.isFinite(elapsed) || elapsed < 0) throw new Error('Invalid native emitter catch-up')
            if (disposed) throw new Error('Native emitter disposed')
            const definition = definitions[name]
            if (!definition || !textures.has(name)) throw new Error('Missing native emitter event dependency')
            const simulation = createEmitterSimulation(definition)
            simulation.trigger(elapsed)
            if (!simulation.active) return
            const group = new THREE.Group()
            group.name = 'native-emitter:' + name
            const meshes = Array.from({length: definition.particle.count}, () => {
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
                    map: textures.get(name), transparent: true, depthTest: false, depthWrite: false,
                    side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
                }))
                mesh.visible = false; mesh.renderOrder = 101; group.add(mesh); return mesh
            })
            scene.add(group); instances.push({name, simulation, group, meshes})
        },
        update(delta: number) {
            if (disposed) return
            for (const instance of instances) instance.simulation.update(delta)
            for (let i = instances.length - 1; i >= 0; i--) if (!instances[i]!.simulation.active) {
                const instance = instances.splice(i, 1)[0]!
                instance.group.removeFromParent()
                for (const mesh of instance.meshes) { mesh.geometry.dispose(); mesh.material.dispose() }
            }
        },
        render, reset: clear,
        dispose() { clear(); disposeTextures(); disposed = true },
        get active() { return instances.some(instance => instance.simulation.active) },
        snapshot() { return instances.map(instance => ({name: instance.name, ...instance.simulation.snapshot()})) },
    }
}

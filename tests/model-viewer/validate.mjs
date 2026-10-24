import fs from 'node:fs/promises'
import path from 'node:path'
import validator from 'gltf-validator'

const root = path.resolve(process.argv[2] || 'tests/model-viewer/generated')
const catalogue = JSON.parse(await fs.readFile(path.join(root, 'models_3d.json'), 'utf8'))
const table = catalogue.animationAssets
if (Object.prototype.hasOwnProperty.call(catalogue, 'animationAssets')
    && (catalogue.schemaVersion !== 4 || !Array.isArray(table))) {
    throw new Error('Animation asset tables require catalogue version 4')
}
function animationRef(value) {
    if (typeof value === 'number') {
        if (catalogue.schemaVersion !== 4 || !table || !Number.isSafeInteger(value)
            || value < 0 || value >= table.length) throw new Error('Invalid compact animation asset reference')
        value = table[value]
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || Object.prototype.hasOwnProperty.call(value, 'asset')) throw new Error('Invalid animation reference')
    return value
}
const references = new Map()
function record(ref, name, allowFixedModel = false) {
    const legacy = ref.path === `models/3d/${ref.sha256}.glb`
    const named = typeof name === 'string' && name.length > 0 && !/[^A-Za-z0-9_-]/.test(name)
        && ref.path === `models/3d/${ref.sha256}/${name}.glb`
    const fixed = allowFixedModel && typeof name === 'string' && name.length > 0 && !/[^A-Za-z0-9_-]/.test(name)
        && ref.path === `models/3d/${name}.glb`
    if (!/^[a-f0-9]{64}$/.test(ref.sha256) || (!legacy && !named && !fixed)) throw new Error('Invalid resource key')
    const previous = references.get(ref.path)
    if (previous && ['sha256', 'bytes', 'rigKey'].some(field => previous[field] !== ref[field])) {
        throw new Error(`Conflicting resource reference: ${ref.path}`)
    }
    references.set(ref.path, ref)
}
for (const [identity, model] of Object.entries(catalogue.models)) {
    record(model, identity, true)
    if (model.wardrobe) record(model.wardrobe)
    for (const value of model.animations) {
        const animation = animationRef(value)
        record(animation, animation.id)
    }
    if (model.additionalActor) {
        record(model.additionalActor.model, undefined)
        for (const value of model.additionalActor.model.animations) {
            const animation = animationRef(value)
            record(animation, animation.id)
        }
    }
}
if (!references.size) throw new Error('No model or animation resources to validate')
const results = []
for (const [key, ref] of references) {
    const bytes = await fs.readFile(path.join(root, key))
    const report = await validator.validateBytes(bytes, { uri: key })
    results.push({ path: key, errors: report.issues.numErrors, warnings: report.issues.numWarnings, messages: report.issues.messages })
}
console.log(JSON.stringify(results, null, 2))
if (results.some(result => result.errors || result.warnings)) process.exitCode = 1

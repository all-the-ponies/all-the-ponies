import type { AnimationRef } from './assets'

const compareText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
const compareNames = (a: string, b: string) => compareText(a.toLowerCase(), b.toLowerCase()) || compareText(a, b)

// Group suffix variants for display; each remains an independent playable clip.
function actionSuffix(id: string) {
    const tokens = id.split('_'), suffix: string[] = []
    const flight = tokens.at(-1) === 'fly' && tokens.length > 2 ? tokens.pop() : null
    while (tokens.length > 1) {
        const token = tokens.at(-1)!
        if (/^(?:\d+[lr]?|north|south|east|west|left|right|[lr]|(?:left|right)\d+)$/i.test(token)) suffix.unshift(tokens.pop()!)
        else {
            const numbered = token.match(/^(.+?)(\d+[lr]?)$/i)
            if (numbered) { tokens[tokens.length - 1] = numbered[1]; suffix.unshift(numbered[2]) }
            break
        }
    }
    return suffix.length ? {base: tokens.join('_') + (flight ? '_fly' : ''), suffix} : null
}

function optionLabel(name: string, base: string) {
    const variant = actionSuffix(name)
    return variant?.base === base
        ? variant.suffix.map(token => /^[lr]$/i.test(token) ? token.toUpperCase() : token).join(' ')
        : name
}

/** No ownership inference or clip merging: the catalogue remains authoritative. */
export function buildAnimationMenu(animations: AnimationRef[], preferredIds: string[] = []) {
    // ATP's preferred list also contains generic idles and the constructor pose.
    // Promote only non-generic entries; the catalogue defines their ownership.
    const preferred = new Set(preferredIds.filter(id => !/^(?:a_bind$|(?:gen|mini|arena)_)/i.test(id)))
    const groups = new Map<string, AnimationRef[]>()
    for (const animation of animations) {
        const base = actionSuffix(animation.id)?.base ?? animation.id
        if (!groups.has(base)) groups.set(base, [])
        groups.get(base)!.push(animation)
    }
    return [...groups].map(([base, members]) => {
        const grouped = members.length > 1
        const choices = members.map(animation => ({animation,
            label: grouped ? optionLabel(animation.name, base) : animation.name,
            preferred: preferred.has(animation.id),
        })).sort((a, b) => compareNames(a.label, b.label) || compareText(a.animation.id, b.animation.id))
        return {id: grouped ? 'group:' + base : members[0].id,
            name: grouped ? base : members[0].name, choices,
            preferred: choices.some(choice => choice.preferred)}
    }).sort((a, b) => Number(b.preferred) - Number(a.preferred)
        || compareNames(a.name, b.name) || compareText(a.id, b.id))
}

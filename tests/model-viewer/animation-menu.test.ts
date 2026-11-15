import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildAnimationMenu } from '../../src/components/model-viewer/animation-menu'

const clip = (id: string) => ({id, name: id, path: `models/3d/${id}.glb`,
    sha256: 'a'.repeat(64), rigKey: 'b'.repeat(64), bytes: 1, duration: 1})

test('declared non-generic actions are pinned; grouping keeps every original clip and separates flight variants', () => {
    const clips = ['gen_tap_north_fly', 'apple_idle_02_r', 'a_bind', 'gen_idle_00_l',
        'gen_tap_south', 'gen_tap_north', 'other_special_01', 'apple_idle_01_l',
        'gen_tap_south_fly', 'gen_idle_00_r', 'mini_jump', 'arena_pony_defeat'].map(clip)
    const preferred = ['gen_idle_00_l', 'a_bind', 'apple_idle_01_l', 'mini_jump', 'arena_pony_defeat']
    const original = [...clips]
    const menu = buildAnimationMenu(clips, preferred)
    assert.equal(menu[0].name, 'apple_idle')
    assert.equal(menu[0].preferred, true)
    assert.deepEqual(menu[0].choices.map(item => item.label), ['01 L', '02 R'])
    assert.deepEqual(menu[0].choices.map(item => item.preferred), [true, false])
    assert.ok(menu.slice(1).every(item => !item.preferred))
    assert.deepEqual(menu.find(item => item.name === 'gen_tap')!.choices.map(item => item.label), ['north', 'south'])
    assert.deepEqual(menu.find(item => item.name === 'gen_tap_fly')!.choices.map(item => item.label), ['north', 'south'])
    const all = menu.flatMap(item => item.choices.map(choice => choice.animation))
    assert.equal(all.length, clips.length)
    assert.equal(new Set(all).size, clips.length)
    assert.ok(clips.every(animation => all.includes(animation)), 'playback receives the original descriptors, including event bindings')
    assert.deepEqual(clips, original)
})

test('plain actions join their variants, singleton names stay intact, and sorting matches PV text order', () => {
    const menu = buildAnimationMenu(['a_trot_2', 'solo_01', 'a_trot', 'a_trot_10', 'gen_walk_end0', 'gen_walk_end13'].map(clip))
    assert.deepEqual(menu.map(item => item.name), ['a_trot', 'gen_walk_end', 'solo_01'])
    assert.deepEqual(menu[0].choices.map(item => item.label), ['10', '2', 'a_trot'])
    assert.equal(menu[2].choices[0].label, 'solo_01')
    assert.deepEqual(buildAnimationMenu([]), [])
})

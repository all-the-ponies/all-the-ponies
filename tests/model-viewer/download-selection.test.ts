import test from 'node:test'
import assert from 'node:assert/strict'
import { allSelected, toggleSelection } from '../../src/components/model-viewer/download-selection'

test('item, partial group and global toggles preserve other selections and deduplicate IDs', () => {
    const empty = new Set<string>()
    const first = toggleSelection(empty, ['a'])
    assert.deepEqual([...empty], [])
    assert.equal(allSelected(first, ['a', 'b']), false)
    const group = toggleSelection(first, ['a', 'b', 'b'])
    assert.deepEqual([...group], ['a', 'b'])
    const global = toggleSelection(group, ['a', 'b', 'c'])
    const removed = toggleSelection(global, ['b'])
    assert.deepEqual([...removed], ['a', 'c'])
    assert.equal(allSelected(removed, ['a', 'b', 'c']), false)
    assert.equal(allSelected(toggleSelection(removed, ['a', 'b', 'c']), ['a', 'b', 'c']), true)
    assert.deepEqual([...toggleSelection(global, ['a', 'b'])], ['c'])
    assert.deepEqual([...toggleSelection(global, ['a', 'b', 'c'])], [])
    assert.equal(allSelected(empty, []), false)
})

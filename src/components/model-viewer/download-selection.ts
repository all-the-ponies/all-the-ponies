/** Selection is independent of playback, menu expansion and display names. */
export function allSelected(selected: ReadonlySet<string>, ids: readonly string[]) {
    return ids.length > 0 && ids.every(id => selected.has(id))
}

export function toggleSelection(selected: ReadonlySet<string>, ids: readonly string[]) {
    const next = new Set(selected), remove = allSelected(selected, ids)
    for (const id of ids) { if (remove) next.delete(id); else next.add(id) }
    return next
}

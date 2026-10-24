<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, shallowRef, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ModelRef } from './assets';
import { buildAnimationMenu } from './animation-menu';
import { allSelected, toggleSelection } from './download-selection';
import AnimationSelectionButton from './AnimationSelectionButton.vue';
import CostumeBonus from '../CostumeBonus.vue';
import Loading from '../Loading.vue';
import SidebarSubmenu from '../sidebar/SidebarSubmenu.vue';
import SidebarItem from '../sidebar/SidebarItem.vue';
import type { mountViewer, ViewerState } from './runtime';
import type { WardrobeProfile, WardrobeSlot } from './wardrobe';
import { createAssetUrl } from '../../scripts/assets';
import { getObject, loaded as gameDataLoaded, translateName } from '../../scripts/gameData';
import { useLocalStorage } from '@vueuse/core';

const props = defineProps<{model: ModelRef, identity?: string}>()
const { t } = useI18n()
const wardrobeOpen = useLocalStorage('model-viewer-wardrobe-open', false)
const animationMenu = computed(() => buildAnimationMenu(props.model.animations, props.model.preferredAnimations))
const selectedAnimations = shallowRef(new Set<string>())
const allAnimationIds = computed(() => props.model.animations.map(animation => animation.id))
const exportMode = shallowRef(false)
const downloadEntry = useTemplateRef('download-entry')
const exporting = shallowRef(false)
const exportProgress = shallowRef('')
const exportError = shallowRef('')
let downloadAbort: AbortController | undefined
const selected = (ids: string[]) => allSelected(selectedAnimations.value, ids)
const toggle = (ids: string[]) => { selectedAnimations.value = toggleSelection(selectedAnimations.value, ids) }
const selectionLabel = (ids: string[], name: string) => t(selected(ids) ? 'model_viewer.remove_export' : 'model_viewer.add_export', {name})
async function leaveExportMode() {
    downloadAbort?.abort()
    downloadAbort = undefined
    exporting.value = false
    exportMode.value = false
    selectedAnimations.value = new Set()
    exportError.value = ''
    exportProgress.value = ''
    await nextTick()
    downloadEntry.value?.focus({preventScroll: true})
}
async function download() {
    if (!controller || exporting.value) return
    const request = new AbortController()
    downloadAbort = request
    exporting.value = true
    exportError.value = ''
    exportProgress.value = t('model_viewer.preparing_download')
    try {
        const source = controller.downloadSource()
        const animations = props.model.animations.filter(animation => selectedAnimations.value.has(animation.id))
        const { downloadModel } = await import('./download')
        const bytes = await downloadModel(source.model, source.visible, animations, request.signal,
            (completed, total) => { exportProgress.value = total ? t('model_viewer.export_progress', {completed, total}) : t('model_viewer.preparing_download') },
            props.model.additionalActor)
        request.signal.throwIfAborted()
        const url = URL.createObjectURL(new Blob([bytes], {type: 'model/gltf-binary'}))
        const link = document.createElement('a')
        link.href = url
        link.download = (props.identity || 'pony').replace(/[^A-Za-z0-9_-]/g, '_') + '.glb'
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        void leaveExportMode()
    } catch (error) {
        if (!request.signal.aborted) exportError.value = `${t('info_card.error')}: ${error instanceof Error ? error.message : String(error)}`
    } finally {
        if (downloadAbort === request) { exporting.value = false; exportProgress.value = ''; downloadAbort = undefined }
    }
}
const host = useTemplateRef('model-host')
const state = reactive<ViewerState>({ready: false, loading: true, playing: false, free: false, activeAnimation: '', error: ''})
let controller: ReturnType<typeof mountViewer> | undefined
let disposed = false
const slots: WardrobeSlot[] = ['Mane', 'Body', 'Tail']
const wardrobe = shallowRef<WardrobeProfile>()
const selectedParts = shallowRef<Partial<Record<WardrobeSlot, string>>>({})
const wardrobeAttempted = shallowRef(false)
const focusedSet = shallowRef('')
const outfitList = useTemplateRef('outfit-list')
const wardrobeBack = useTemplateRef('wardrobe-back')
let outfitScroll = 0
let focusedCard: HTMLButtonElement | undefined

// Rebuild only when a new owner profile is installed. Names remain reactive to
// language changes; selection never scans the full game catalogue.
const wardrobeOptions = computed(() => {
    const profile = wardrobe.value
    if (!profile) return undefined
    const ownerSets = props.identity && gameDataLoaded ? getObject(props.identity, 'pony')?.costumes : undefined
    const setIds = ownerSets ? ownerSets.filter(id => Object.prototype.hasOwnProperty.call(profile.sets, id)) : Object.keys(profile.sets)
    const sets = setIds.map(id => {
        const object = gameDataLoaded ? getObject(id, 'costume') : null
        const name = translateName(object)
        return {
            id, image: createAssetUrl(object?.image?.main?.path), bonus: object?.bonus,
            name: computed(() => name.value || id),
            parts: slots.flatMap(slot => profile.sets[id][slot] ? [{slot, id: profile.sets[id][slot]!}] : []),
        }
    })
    const parts = Object.fromEntries(Object.keys(profile.parts).map(id => {
        const object = gameDataLoaded ? getObject(id, 'costume_part') : null
        return [id, {image: createAssetUrl(object?.image?.main?.path), outfit: undefined as typeof sets[number] | undefined}]
    }))
    for (const set of sets) for (const part of set.parts) {
        parts[part.id].outfit ??= set
        const linked = profile.parts[part.id].linked
        if (linked) parts[linked].outfit ??= set
    }
    return {sets, parts}
})
const focusedOutfit = computed(() => wardrobeOptions.value?.sets.find(set => set.id === focusedSet.value))
function partName(id: string) {
    return wardrobeOptions.value?.parts[id]?.outfit?.name.value || id
}
async function focusOutfit(id: string, event: MouseEvent) {
    outfitScroll = outfitList.value?.scrollTop ?? 0
    focusedCard = event.currentTarget as HTMLButtonElement
    focusedSet.value = id
    await nextTick()
    wardrobeBack.value?.focus({preventScroll: true})
}
async function backToOutfits() {
    focusedSet.value = ''
    await nextTick()
    if (outfitList.value) outfitList.value.scrollTop = outfitScroll
    focusedCard?.focus({preventScroll: true})
}
function updateState(value: ViewerState) {
    Object.assign(state, value)
    if (controller?.wardrobe) {
        wardrobe.value = controller.wardrobe
        selectedParts.value = controller.snapshot().wardrobe ?? {}
    }
    if (props.model.wardrobe && state.ready && wardrobeOpen.value && !wardrobeAttempted.value) void openWardrobe()
}
async function openWardrobe() {
    if (!controller || !state.ready || state.wardrobeLoading || wardrobe.value) return
    wardrobeAttempted.value = true
    await controller.openWardrobe()
}
function toggleWardrobe(event: Event) {
    wardrobeOpen.value = (event.target as HTMLDetailsElement).open
    if (wardrobeOpen.value) void openWardrobe()
}

onMounted(async () => {
    try {
        const { mountViewer } = await import('./runtime')
        if (disposed) return
        controller = mountViewer(host.value!, props.model, updateState)
        host.value!.querySelector('canvas')?.setAttribute('aria-label', t('model_viewer.canvas'))
    } catch (error) {
        if (disposed) return
        state.loading = false
        state.error = error instanceof Error ? error.message : String(error)
    }
})
onBeforeUnmount(() => {
    disposed = true
    downloadAbort?.abort()
    controller?.dispose()
})
</script>

<template>
    <div class="model-viewer" :class="{'export-selecting': exportMode}" :aria-busy="state.loading">
        <div class="model-host" ref="model-host">
            <button
                class="preview-control rotation button-circle button-blue"
                :disabled="!state.ready"
                :aria-pressed="state.free"
                :aria-label="t(state.free ? 'model_viewer.lock_rotation' : 'model_viewer.unlock_rotation')"
                :title="t(state.free ? 'model_viewer.lock_rotation' : 'model_viewer.unlock_rotation')"
                @click="controller?.setFree(!state.free)"
            >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path v-if="!state.free" d="M7 10V7a5 5 0 0 1 10 0v3" />
                    <path v-else d="M7 10V7a5 5 0 0 1 9-3" />
                    <rect x="4" y="10" width="16" height="12" rx="2" />
                    <path d="M12 15v3" />
                </svg>
            </button>
            <button ref="download-entry" class="preview-control download-entry button-circle button-blue"
                :disabled="!state.ready || exporting" :aria-pressed="exportMode"
                :aria-label="t('model_viewer.choose_export')" :title="t('model_viewer.choose_export')"
                @click="exportMode = true">
                <img class="download-icon" src="@/assets/images/ui/icons/download-icon.png" alt="">
                <span v-if="selectedAnimations.size" class="export-count button-circle button-red" aria-hidden="true">{{ selectedAnimations.size }}</span>
            </button>
        </div>
        <div class="model-actions">
            <button class="button button-blue" :disabled="!state.ready" @click="controller?.reset()">
                {{ t('model_viewer.reset') }}
            </button>
            <div v-if="exportMode" class="animation-select-all">
                <AnimationSelectionButton :selected="selected(allAnimationIds)" :label="selectionLabel(allAnimationIds, t('model_viewer.select_all'))"
                    :disabled="!allAnimationIds.length" @toggle="toggle(allAnimationIds)" />
                <span>{{ t('model_viewer.select_all') }}</span>
            </div>
            <ul class="model-animations" :aria-label="t('model_viewer.animations')">
                <template v-for="entry in animationMenu" :key="entry.id">
                    <SidebarSubmenu v-if="entry.choices.length > 1" class="animation-group"
                        :class="{preferred: entry.preferred, playing: entry.choices.some(choice => choice.animation.id === state.activeAnimation)}">
                        <template #prefix>
                            <AnimationSelectionButton v-if="exportMode" class="group-selection" :selected="selected(entry.choices.map(choice => choice.animation.id))"
                                :label="selectionLabel(entry.choices.map(choice => choice.animation.id), entry.name)"
                                @toggle="toggle(entry.choices.map(choice => choice.animation.id))" />
                        </template>
                        <template #title>{{ entry.name }}</template>
                        <SidebarItem v-for="choice in entry.choices" :key="choice.animation.id" class="animation-row">
                            <AnimationSelectionButton v-if="exportMode" :selected="selected([choice.animation.id])" :label="selectionLabel([choice.animation.id], choice.animation.name)" @toggle="toggle([choice.animation.id])" />
                            <button class="animation-choice" :title="choice.animation.name"
                                :disabled="!state.ready" :class="{preferred: choice.preferred}"
                                :aria-pressed="state.activeAnimation === choice.animation.id"
                                @click="controller?.play(choice.animation)">{{ choice.label }}</button>
                        </SidebarItem>
                    </SidebarSubmenu>
                    <SidebarItem v-else class="animation-row">
                        <AnimationSelectionButton v-if="exportMode" :selected="selected([entry.choices[0].animation.id])" :label="selectionLabel([entry.choices[0].animation.id], entry.name)" @toggle="toggle([entry.choices[0].animation.id])" />
                        <button class="animation-choice" :title="entry.name"
                            :disabled="!state.ready" :class="{preferred: entry.preferred}"
                            :aria-pressed="state.activeAnimation === entry.choices[0].animation.id"
                            @click="controller?.play(entry.choices[0].animation)">{{ entry.name }}</button>
                    </SidebarItem>
                </template>
            </ul>
            <div v-if="exportMode" class="export-actions">
                <button class="button button-blue" :disabled="!state.ready || state.wardrobeLoading || exporting" @click="download">{{ t('common.export') }}</button>
                <button class="button button-blue" @click="leaveExportMode">{{ t('button.cancel') }}</button>
            </div>
            <small v-if="exportMode && exporting" role="status">{{ exportProgress }}</small>
            <small v-if="exportMode && exportError" role="alert">{{ exportError }}</small>
        </div>
        <details v-if="props.model.wardrobe" class="model-wardrobe" :open="wardrobeOpen" @toggle="toggleWardrobe">
            <summary class="wardrobe-header" :aria-disabled="!state.ready" @click="!state.ready && $event.preventDefault()">
                <span>{{ t('model_viewer.wardrobe') }}</span>
                <span v-if="wardrobeOpen && focusedOutfit" class="wardrobe-header-actions">
                    <button ref="wardrobe-back" class="wardrobe-back button-circle button-blue" :aria-label="t('model_viewer.back_to_outfits')" :title="t('model_viewer.back_to_outfits')" @click.stop.prevent="backToOutfits">←</button>
                </span>
            </summary>
            <div class="wardrobe-content">
                <Loading v-if="state.wardrobeLoading" class="wardrobe-loading" role="status" />
                <template v-if="wardrobeOptions">
                    <div v-show="!focusedOutfit" ref="outfit-list" class="wardrobe-outfits" role="group" :aria-label="t('model_viewer.choose_outfit')" tabindex="0">
                        <button
                            v-for="set in wardrobeOptions.sets"
                            :key="set.id"
                            :class="{'without-image': !set.image}"
                            :title="set.id"
                            @click="focusOutfit(set.id, $event)"
                        >
                            <img v-if="set.image" class="outfit-preview" :src="set.image" alt="" loading="lazy">
                            <span class="outfit-info">
                                <strong>{{ set.name.value }}</strong>
                                <CostumeBonus v-if="set.bonus?.type" :bonus="set.bonus" class="outfit-bonus" />
                            </span>
                            <span class="outfit-slots">
                                <template v-for="part in set.parts" :key="part.id">
                                    <img v-if="wardrobeOptions.parts[part.id].image" :src="wardrobeOptions.parts[part.id].image" :alt="t(`model_viewer.slot_${part.slot.toLowerCase()}`)" :title="t(`model_viewer.slot_${part.slot.toLowerCase()}`)" loading="lazy">
                                    <span v-else>{{ t(`model_viewer.slot_${part.slot.toLowerCase()}`) }}</span>
                                </template>
                            </span>
                        </button>
                    </div>
                    <div v-if="focusedOutfit" class="wardrobe-outfit-detail">
                        <strong class="wardrobe-outfit-name">{{ focusedOutfit.name.value }}</strong>
                        <div class="wardrobe-parts" role="group" :aria-label="t('model_viewer.outfit_parts')">
                            <button
                                v-for="part in focusedOutfit.parts"
                                :key="part.id"
                                :aria-pressed="selectedParts[part.slot] === part.id"
                                :title="part.id"
                                @click="controller?.selectPart(part.id)"
                            >
                                <img v-if="wardrobeOptions.parts[part.id].image" :src="wardrobeOptions.parts[part.id].image" alt="" loading="lazy">
                                <span>
                                    {{ t(`model_viewer.slot_${part.slot.toLowerCase()}`) }}
                                </span>
                            </button>
                        </div>
                    </div>
                    <div class="wardrobe-current" role="group" :aria-label="t('model_viewer.current_appearance')">
                        <dl aria-live="polite">
                            <div v-for="slot in slots" :key="slot">
                                <dt>{{ t(`model_viewer.slot_${slot.toLowerCase()}`) }}:</dt>
                                <dd :title="selectedParts[slot]">
                                    {{ partName(selectedParts[slot]) }}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </template>
            </div>
        </details>
        <p v-if="state.error && !state.wardrobeLoading" class="model-status" role="alert">{{ t('info_card.error') }}: {{ state.error }}</p>
    </div>
</template>

<style scoped>
.model-viewer {
    --model-height: min(36dvh, 19rem);
    --wardrobe-height: clamp(12rem, 38dvh, 20rem);
    --wardrobe-header-height: 2.35rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 11rem);
    grid-template-rows: var(--model-height) auto;
    gap: .5rem;
    width: min(40rem, calc(95dvw - 1.3rem));
    max-width: 100%;
}
.model-host {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    background: linear-gradient(#eef4fa, #f5edf5);
    border-radius: .3rem;
}
.model-host :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
}
.preview-control {
    position: absolute;
    z-index: 1;
    right: .45rem;
    display: grid;
    place-items: center;
    margin: 0;
    padding: .2em;
    font-size: 2rem;
}
.rotation { top: .45rem; }
.download-entry { bottom: .45rem; }
.export-count {
    position: absolute;
    top: -.2rem;
    right: -.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    margin: 0;
    font-size: .85rem;
    line-height: 1;
    background: var(--red);
    box-shadow: none;
    text-shadow: none;
    overflow: visible;
    pointer-events: none;
}
.preview-control svg,
.preview-control img {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    object-fit: contain;
    pointer-events: none;
}
.preview-control svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.model-actions {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    min-height: 0;
    min-width: 0;
    /* Both upper panels share a bounded row; only the animation list scrolls. */
    contain: size;
}
.model-actions > .button {
    flex-shrink: 0;
    font-size: 1rem;
    margin: 0;
}
.model-animations {
    --padding-inline: .5rem;
    --font-size: .85rem;
    --font-family: inherit;
    font-size: var(--font-size);
    margin: 0;
    padding: 0;
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    background: var(--pink);
    border-radius: .3rem;
}
.animation-select-all, .animation-row {
    display: flex;
    align-items: center;
    gap: .2rem;
}
.animation-select-all { font-size: .85rem; }
.export-selecting .animation-row { padding-inline-start: .25rem; }
.animation-group { position: relative; }
.group-selection { position: absolute; z-index: 1; left: .25rem; top: .1rem; }
.export-selecting .animation-group :deep(.menu-title) { padding-inline-start: 1.5rem; min-height: 1.65rem; }
.export-actions { display: flex; flex-wrap: wrap; gap: .3rem; }
.export-actions .button { flex: 1 0 auto; margin: 0; font-size: .8rem; }
.model-animations .animation-choice {
    display: block;
    width: 100%;
    padding: .2rem .5rem;
    border: 0;
    background: transparent;
    color: white;
    font: inherit;
    text-align: start;
    text-shadow: var(--text-shadow);
    overflow-wrap: anywhere;
    cursor: pointer;
}
.model-animations :deep(.menu-title) {
    overflow-wrap: anywhere;
}
.model-animations :deep(.submenu:not(.expanded)) {
    visibility: hidden;
}
.animation-group.playing :deep(.menu-title) {
    background: rgba(0, 0, 0, .2);
}
.animation-group.preferred :deep(.menu-title),
.model-animations .animation-choice.preferred {
    font-weight: 700;
}
.model-animations .animation-choice:hover,
.model-animations .animation-choice:focus-visible,
.model-animations .animation-choice[aria-pressed="true"] {
    background: rgba(0, 0, 0, .2);
}
.model-wardrobe {
    grid-column: 1 / -1;
    min-width: 0;
}
.wardrobe-header {
    display: flex;
    align-items: center;
    gap: .35rem;
    height: var(--wardrobe-header-height);
    cursor: pointer;
    font-weight: bold;
    list-style: none;
}
.wardrobe-header::-webkit-details-marker {
    display: none;
}
.wardrobe-header::before {
    content: '▸';
}
.model-wardrobe[open] > .wardrobe-header::before {
    content: '▾';
}
.wardrobe-header[aria-disabled="true"] {
    opacity: .5;
    cursor: default;
}
.wardrobe-header-actions {
    display: flex;
    align-items: center;
    gap: .45rem;
    margin-inline-start: auto;
    padding-inline-end: 2px;
}
.model-wardrobe .button {
    margin: 0;
    font-size: .85rem;
}
.wardrobe-back {
    flex-shrink: 0;
    margin: 0;
    font-size: 2rem;
}
.wardrobe-content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: .25rem;
    height: calc(var(--wardrobe-height) - var(--wardrobe-header-height));
    min-height: 0;
    overflow: hidden;
}
.wardrobe-loading {
    inset: 0;
}
.wardrobe-outfits {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    grid-auto-rows: max-content;
    gap: .2rem;
    align-content: start;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 2px 1px .4rem;
}
.wardrobe-outfits button,
.wardrobe-parts button {
    min-width: 0;
    min-height: 2.75rem;
    padding: .35rem;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: .85rem;
    text-align: start;
    overflow-wrap: anywhere;
    cursor: pointer;
}
.wardrobe-outfits button {
    border: 0;
    border-radius: 0;
    background: transparent url('../../assets/images/ui/native-wardrobe-set-card.png') center / 100% 100% no-repeat;
    padding: .35rem .7rem;
    display: grid;
    grid-template-columns: 3.5rem minmax(0, 1fr) auto;
    align-items: center;
    gap: .4rem;
}
.wardrobe-outfits button.without-image {
    grid-template-columns: minmax(0, 1fr) auto;
}
.outfit-preview {
    width: 3.5rem;
    height: 5rem;
    object-fit: contain;
}
.outfit-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: .2rem;
    min-width: 0;
}
.outfit-info strong,
.wardrobe-outfit-name {
    color: var(--pink);
}
.outfit-bonus,
.outfit-slots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .25rem;
    font-size: .75rem;
}
.outfit-slots {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-self: end;
}
.outfit-bonus :deep(img) {
    width: 1.1rem;
    height: 1.1rem;
    object-fit: contain;
}
.outfit-slots img {
    width: 1.4rem;
    height: 1.4rem;
    object-fit: contain;
}
.wardrobe-outfit-detail {
    display: flex;
    flex-direction: column;
    gap: .4rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: .2rem;
}
.wardrobe-outfit-name {
    overflow-wrap: anywhere;
}
.wardrobe-parts {
    display: flex;
    gap: .4rem;
    flex: 1;
    min-height: 0;
    padding: .65rem 1rem;
    background: url('../../assets/images/ui/native-wardrobe-set-card.png') center / 100% 100% no-repeat;
}
.wardrobe-parts button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .3rem;
    flex: 1;
    text-align: center;
}
.wardrobe-parts img {
    width: min(100%, 6rem, 14dvh);
    height: auto;
    aspect-ratio: 1;
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: contain;
}
.wardrobe-outfits button:hover {
    filter: brightness(1.03);
}
.wardrobe-parts button[aria-pressed="true"] img {
    outline: .25rem solid #37cdcc;
    outline-offset: .05rem;
    box-shadow: 0 0 .7rem .25rem #66ffff;
}

.wardrobe-current {
    flex-shrink: 0;
    overflow: hidden;
    margin-top: .15rem;
    font-size: .75rem;
    white-space: nowrap;
}
.wardrobe-current dl {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: .7rem;
    margin: 0;
}
.wardrobe-current dl > div {
    display: flex;
    gap: .2rem;
    min-width: 0;
}
.wardrobe-current dt {
    flex-shrink: 0;
    font-weight: bold;
}
.wardrobe-current dd {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}
.model-viewer .model-wardrobe button:focus-visible,
.model-wardrobe summary:focus-visible,
.wardrobe-outfits:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -2px;
}
.model-status {
    grid-column: 1 / -1;
    margin: .2rem 0;
    max-height: min(8dvh, 2.5rem);
    overflow-y: auto;
    overflow-wrap: anywhere;
}
/* Reserve room inside the dialog for ATP's title and close control. */
:global(.dialog:has(.model-viewer)) {
    position: fixed;
    top: 50dvh;
    left: 50dvw;
    right: auto;
    bottom: auto;
    margin: 0;
    translate: -50% -50%;
    padding: 2rem .65rem .65rem;
    min-height: 0;
    max-height: calc(100dvh - 1rem);
}
:global(.dialog:has(.model-viewer) .dialog-content) {
    margin: 0;
}
:global(.dialog:has(.model-viewer) .dialog-menu:empty) {
    display: none;
}
:global(.dialog:has(.model-viewer) .dialog-header) {
    top: .25rem;
    translate: none;
    max-width: calc(100% - 5rem);
    padding: 0;
    color: var(--blue);
    text-shadow: none;
    font-size: 1.3rem;
    line-height: 1.2;
    z-index: 1;
}
:global(.dialog:has(.model-viewer) .dialog-header::before) {
    display: none;
}
:global(.dialog:has(.model-viewer) .dialog-close) {
    /* Keep XButton's native 1.2em size and 0.2em icon padding at a 2rem diameter. */
    font-size: calc(2rem / 1.2);
    top: .1rem;
    right: .3rem;
    margin: 0;
    translate: none;
    z-index: 2;
}
:global(.dialog:has(.model-viewer):focus) {
    outline: none;
}
@media (max-width: 480px) {
    :global(.dialog:has(.model-viewer)) {
        padding: 2rem .4rem .4rem;
    }
    .preview-control {
        right: .25rem;
    }
    .rotation { top: .25rem; }
    .download-entry { bottom: .25rem; }
    :global(.dialog:has(.model-viewer) .dialog-header) {
        font-size: 1.1rem;
    }
    .model-viewer {
        --model-height: min(30dvh, 14rem);
        width: calc(95dvw - .8rem);
        grid-template-columns: minmax(0, 1fr) minmax(6rem, .6fr);
        gap: .35rem;
    }
    .model-actions {
        font-size: .85rem;
    }
    .model-actions > .button {
        font-size: .85rem;
    }
    .wardrobe-header {
        font-size: .9rem;
        gap: .25rem;
    }
    .wardrobe-header-actions {
        gap: .3rem;
    }
    .wardrobe-outfits {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .wardrobe-outfits button {
        grid-template-columns: 2.5rem minmax(0, 1fr) auto;
        gap: .25rem;
        font-size: .8rem;
    }
    .outfit-preview {
        width: 2.5rem;
        height: 4.5rem;
    }
    .outfit-slots img {
        width: 1.2rem;
        height: 1.2rem;
    }
}
@media (max-height: 500px) {
    .model-viewer {
        --model-height: 40dvh;
    }
    :global(.dialog:has(.model-viewer)) {
        padding-top: 2rem;
    }
    :global(.dialog:has(.model-viewer) .dialog-header) {
        font-size: 1.1rem;
    }
}
</style>

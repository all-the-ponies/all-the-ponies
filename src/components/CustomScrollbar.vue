<script setup lang="ts">
import { useElementBounding, useElementSize, useResizeObserver } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

const props = withDefaults(defineProps<{
    minThumbSize?: number,
    autoHide?: boolean,
}>(), {
    minThumbSize: 24,
    autoHide: true,
})

const viewport = useTemplateRef('viewport')
const content = useTemplateRef('content')
const track = useTemplateRef('track')

const thumbPadding = ref(2)

const showScrollbar = ref(false)
const thumbHeight = ref(0)
const thumbTop = ref(0)
const isActive = ref(false)
const isVisible = ref(true)

let dragging = false
let dragStartY = 0
let scrollStartTop = 0
let hideTimeout: ReturnType<typeof setTimeout> | undefined

function updateThumb() {
    const el = viewport.value
    if (!el) return

    let { scrollHeight, clientHeight, scrollTop } = el
    showScrollbar.value = scrollHeight > clientHeight + 1

    scrollHeight -= thumbPadding.value * 2
    clientHeight -= thumbPadding.value * 2

    if (!showScrollbar.value) return

    const ratio = clientHeight / scrollHeight
    thumbHeight.value = Math.max(ratio * clientHeight, props.minThumbSize)

    const maxThumbTop = clientHeight - thumbHeight.value
    const maxScrollTop = scrollHeight - clientHeight
    thumbTop.value = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0
}

function flashActive() {
    isVisible.value = true
    clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
        if (!dragging) isVisible.value = false
    }, 800)
}

function onScroll() {
    updateThumb()
}

function onThumbPointerDown(e: PointerEvent) {
    dragging = true
    isActive.value = true
    dragStartY = e.clientY
    scrollStartTop = viewport.value?.scrollTop ?? 0
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    document.body.style.userSelect = 'none'
    e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
    if (!dragging || !viewport.value) return
    const el = viewport.value
    const { scrollHeight, clientHeight } = el
    const maxScrollTop = scrollHeight - clientHeight
    const maxThumbTop = clientHeight - thumbHeight.value
    if (maxThumbTop <= 0) return

    const deltaY = e.clientY - dragStartY
    const scrollDelta = (deltaY / maxThumbTop) * maxScrollTop
    el.scrollTop = scrollStartTop + scrollDelta
}

function onPointerUp() {
    dragging = false
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    document.body.style.userSelect = ''
    flashActive()
    isActive.value = false
}

// Clicking on empty track space (not the thumb) jumps the thumb there.
function onTrackPointerDown(e: PointerEvent) {
    if (e.target !== track.value || !viewport.value || !track.value) return

    const trackRect = track.value.getBoundingClientRect()
    const clickY = e.clientY - trackRect.top
    const el = viewport.value
    const { scrollHeight, clientHeight } = el
    const maxScrollTop = scrollHeight - clientHeight
    const target = (clickY / trackRect.height) * scrollHeight - clientHeight / 2

    el.scrollTop = Math.max(0, Math.min(maxScrollTop, target))
}

useResizeObserver([viewport, content], updateThumb)

// Let a parent force a re-measure after it changes slot content programmatically.
defineExpose({ updateThumb })
</script>

<template>
    <div class="scrollbar-container" @mouseleave="flashActive">
        <div class="scrollbar-viewport" ref="viewport" @scroll="onScroll">
            <div class="scrollbar-content" ref="content">
                <slot></slot>
            </div>
        </div>
        <div
            v-if="showScrollbar"
            class="scrollbar-track"
            :class="{
                active: isActive,
                visible: !autoHide || isVisible,
            }"
            ref="track"
            @pointerdown="onTrackPointerDown"
        >
            <div
                class="scrollbar-thumb"
                :style="{
                    height: thumbHeight + 'px',
                    transform: `translateY(${thumbTop}px)`,
                }"
                @pointerdown="onThumbPointerDown"
            ></div>
        </div>
    </div>
</template>

<style scoped>

.scrollbar-container {
    position: relative;
    height: 100%;
    overflow: hidden;
}

.scrollbar-viewport {
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;

    /* Hide the native scrollbar; we draw our own. */
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.scrollbar-viewport::-webkit-scrollbar {
    display: none;
}

.scrollbar-content {
    height: 100%;
}

.scrollbar-track {
    --scrollbar-width: 10px;
    --scrollbar-hover-width: 12px;
    --scrollbar-padding: 2px;
    
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 10px;

    background-color: var(--scrollbar-track-color, transparent);
    border-radius: var(--scrollbar-radius, 4px);

    opacity: 0;
    transition: opacity 200ms ease, width 200ms ease;
}

.scrollbar-track.visible,
.scrollbar-container:hover .scrollbar-track {
    opacity: 1;
}

.scrollbar-thumb {
    position: absolute;
    top: var(--scrollbar-padding);
    left: var(--scrollbar-padding);
    width: calc(100% - (var(--scrollbar-padding) * 2));

    background-color: var(--scrollbar-thumb-color, rgba(255, 255, 255, 0.4));
    border-radius: var(--scrollbar-radius, 4px);

    cursor: pointer;
    touch-action: none;
    transition: background-color 150ms ease;
}

.scrollbar-track.active .scrollbar-thumb,
.scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover-color, rgba(255, 255, 255, 0.6));
}

.scrollbar-track.active,
.scrollbar-track:hover {
    width: var(--scrollbar-hover-width);
    opacity: 1;
}

</style>

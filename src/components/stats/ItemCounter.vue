<script setup lang="ts">
import { createAssetUrl } from '@/scripts/assets';
import { getObject, translateName } from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    item: GameObjectId | GameObject,
    value: number,
    scale?: number,
}>(), {
    scale: 1,
})

const item = computed(() => getObject(props.item))
const itemImage = computed(() => createAssetUrl(item.value?.image.main.path))
const itemName = translateName(item)
</script>

<template>
    <div class="item-counter" :style="{ '--scale': scale }">
        <img class="item-counter__icon" :src="itemImage" :alt="itemName" />
        <div class="item-counter__box">
            <span class="item-counter__value">{{ $n(value) }}</span>
        </div>
    </div>
</template>

<style scoped>
.item-counter {
    /* One base unit; every size below is a multiple of it */
    --u: calc(var(--scale, 1) * 1px);

    --slant: calc(7 * var(--u));      /* how far the top edge is shifted right */
    --b: calc(4 * var(--u));          /* outline thickness (top/bottom) */
    --bx: calc(5 * var(--u));         /* outline thickness (sides) */
    --overlap: calc(26 * var(--u));   /* how far the box tucks under the icon */

    display: inline-flex;
    align-items: center;
    height: calc(56.636 * var(--u));
}

.item-counter__icon {
    position: relative;
    z-index: 1;
    width: calc(50 * var(--u));
    height: calc(56.636 * var(--u));
    flex: none;
    object-fit: contain;
}

.item-counter__box {
    position: relative;
    min-width: 4rem;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(36 * var(--u));
    margin-left: calc(var(--overlap) * -1);
    padding-left: calc(var(--overlap) + var(--slant) + 2 * var(--u));
    padding-right: calc(var(--slant) + 14 * var(--u));
}

.item-counter__box::before,
.item-counter__box::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
}

.item-counter__box::before {
    background: rgb(255 255 255 / 0.976);
    clip-path: polygon(
        evenodd,
        0 100%,
        calc(100% - var(--slant)) 100%,
        100% 0,
        var(--slant) 0,
        0 100%,
        var(--bx) calc(100% - var(--b)),
        calc(100% - var(--slant) - var(--bx)) calc(100% - var(--b)),
        calc(100% - var(--bx)) var(--b),
        calc(var(--slant) + var(--bx)) var(--b),
        var(--bx) calc(100% - var(--b))
    );
}

.item-counter__box::after {
    background: rgb(255 255 255 / 0.5);
    clip-path: polygon(
        var(--bx) calc(100% - var(--b)),
        calc(100% - var(--slant) - var(--bx)) calc(100% - var(--b)),
        calc(100% - var(--bx)) var(--b),
        calc(var(--slant) + var(--bx)) var(--b)
    );
}

.item-counter__value {
    font-size: calc(26 * var(--u));
    line-height: 1;
    color: #c078be;
    -webkit-text-stroke: calc(5 * var(--u)) #fff;
    paint-order: stroke fill;
    white-space: nowrap;
}
</style>

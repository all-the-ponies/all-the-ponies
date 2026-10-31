<script lang="ts" setup>
import { ref, useId, onBeforeUnmount, useTemplateRef, computed } from 'vue'
import {arrow, autoUpdate, flip, offset, shift, useFloating} from '@floating-ui/vue';

const props = defineProps<{
    label?: string,
}>()

const id = useId()
const infoButton = useTemplateRef('info-button')
const popover = useTemplateRef('popover')
const arrowEl = useTemplateRef('arrow')

const { floatingStyles, placement, middlewareData } = useFloating(infoButton, popover, {
  placement: 'top',
  middleware: [
    flip(),
    offset(12),
    shift({ padding: 8 }),
    arrow({  element: arrowEl, padding: 8 }),
  ],
  whileElementsMounted: autoUpdate,
})

const arrowStyles = computed(() => {
  const { x, y } = middlewareData.value.arrow ?? {}
  const side = placement.value.split('-')[0] as 'top' | 'right' | 'bottom' | 'left'
  const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side]
  return {
    left: x != null ? `${x}px` : '',
    top: y != null ? `${y}px` : '',
    [opposite]: 'calc(-7px)',
  }
})

</script>

<template>
  <span class="info-wrap">
    <button
      ref="info-button"
      class="info-button button-circle button-blue"
      :aria-label="label || $t('common.info')"
      :popovertarget="id"
      popovertargetaction="toggle"
    >
      <span aria-hidden="true">i</span>
    </button>

    <div
      :id="id"
      ref="popover"
      popover="auto"
      class="info-popover"
      :data-placement="placement.split('-')[0]"
      :style="floatingStyles"
    >
      <slot></slot>
      <span ref="arrow" class="arrow" :style="arrowStyles" aria-hidden="true" />
    </div>
  </span>
</template>

<style scoped lang="css">
.info-button {
  font-size: 1rem;
}

.info-popover {
  margin: 0;
  overflow: visible;
  
  background-color: white;
  padding: 0.5rem;
  font-size: 1rem;
  color: var(--blue);
  max-width: 40ch;
  text-align: center;

  /* --border-color: var(--blue); */
  /* --box-shadow: inset 0px 0px 6px var(--border-color); */
  border: 2px solid var(--light-blue);
  box-shadow: var(--box-shadow);
  border-radius: 0.8rem;
}

.arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: white;     /* covers the popover border under the base */
  border: 2px solid var(--light-blue);
  border-radius: 2px;          /* softens the tip */
  transform: rotate(45deg);
}

/* Keep only the triangle that sticks out. Coordinates are in the
   arrow's own (pre-rotation) box, so each side keeps the corner that
   ends up pointing away from the popover. */
.info-popover[data-placement='top']    .arrow { clip-path: polygon(100% 0, 100% 100%, 0 100%); }
.info-popover[data-placement='bottom'] .arrow { clip-path: polygon(0 0, 100% 0, 0 100%); }
.info-popover[data-placement='left']   .arrow { clip-path: polygon(0 0, 100% 0, 100% 100%); }
.info-popover[data-placement='right']  .arrow { clip-path: polygon(0 0, 0 100%, 100% 100%); }
</style>

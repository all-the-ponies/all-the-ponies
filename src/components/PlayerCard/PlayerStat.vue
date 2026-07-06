<script setup lang="ts">
import type { PlayerStatName } from "@/scripts/api.types";
import { computedAsync } from "@vueuse/core";
import { computed } from "vue";

const props = defineProps<{
  stat: PlayerStatName;
  count: number;
}>();

const stat = computed(() => props.stat);
const count = computed(() => props.count);

const statNameMap: Record<PlayerStatName, string> = {
  pony: "ponies",
  pony_alt: "transformables",
  shop: "shops",
  gem_shop: "gem-shops",
  costume: "costumes",
  collection: "collections",
  hots: "wh-collections",
};

const statImage = computedAsync(async () => {
  return (
    await import(
      `@/assets/images/ui/player-card/stat/stat-${statNameMap[stat.value]}.png`
    )
  ).default;
});
</script>

<template>
  <svg viewBox="0 0 25 12.619566" width="25" height="12.619566">
    <g transform="matrix(1.0000094,0,0,1.0000094,-40.424552,-15.045318)">
      <g transform="matrix(0.05587313,0,0,0.15736487,45.451381,21.659925)">
        <path
          d="m 262.45,32.25 5.8,-28.2 H 10.35 L 4.9,32.25 h 257.55 m 3.5,3.75 H 0 L 7.25,0 H 273 l -7.05,36"
          fill="#ffffff"
          fill-opacity="0.396078"
          fill-rule="evenodd"
          stroke="none"
        />
        <path
          d="M 262.45,32.25 H 4.9 l 5.45,-28.2 h 257.9 l -5.8,28.2"
          fill="#fbfbfb"
          fill-opacity="0.278431"
          fill-rule="evenodd"
          stroke="none"
        />
      </g>
      <text
        x="57.38147"
        y="26.3"
        font-family="Celestia Medium Redux, Arial, Helvetica, sans-serif"
        font-size="4.79214px"
        text-anchor="middle"
        fill="#351858"
        stroke="#efefef"
        stroke-width="0.17516"
        paint-order="stroke fill markers"
      >
        <tspan>{{ count }}</tspan>
      </text>
      <image
        :href="statImage"
        x="40.424171"
        y="15.045176"
        width="12.36233"
        height="12.619882"
      />
    </g>
  </svg>
</template>

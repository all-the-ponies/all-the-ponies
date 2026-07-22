<script setup lang="ts">
import MazeMap from '@/components/maze/MazeMap.vue';
import { Config } from 'vike-vue/Config';


</script>

<template>
    <Config :title="$t('maze.title.long')"></Config>

    <div>
        <section>
            <h1>{{ $t('maze.title.long') }}</h1>
        </section>
        <section>
            <MazeMap></MazeMap>
        </section>
    </div>
</template>

<style lang="css" scoped>

</style>

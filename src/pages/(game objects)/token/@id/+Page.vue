<script setup lang="ts">
import { computed } from 'vue';
import gameData, { getFortuneShopData, getObject, getTaskInfo, translateName } from '@/scripts/gameData'
import BackButton from '@/components/buttons/BackButton.vue';
import { staticImage } from '@/scripts/common';
import { usePageContext } from 'vike-vue/usePageContext';
import { Config } from 'vike-vue/Config';
import absoluteUrl from '@/scripts/absoluteUrl';
import Link from '@/components/Link.vue';
import { useData } from 'vike-vue/useData';
import type { AvatarType, DecorType } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';
import type { Data } from './+data';
import TaskInfo from '@/components/TaskInfo.vue';


const pageContext = usePageContext()
const data = useData<Data>()
const token = computed(() => data.token)

const name = computed(() => {
    let name = translateName(token.value).value
    return name
})

const tasks = computed(() => {
    /**
     * Sort tasks by
     * 1. Tokens first
     * 2. Gems
     * 3. Bits/gems to duration ratio
     */
    
    let tasks = token.value.tasks

    if (!tasks) {
        return []
    }

    let result = tasks.map(taskId => getTaskInfo(taskId))
                    .filter(task => !task.id.includes('TLS'))
    
    result.sort((a, b) => {
        if (Boolean(a.reward.token) !== Boolean(b.reward.token)) {
            return a.reward.token ? -1 : 1
        }
        return (a.reward.gems - b.reward.gems) || (
            ((a.reward.gems || a.reward.bits) / a.duration) - 
            ((b.reward.gems || b.reward.bits) / b.duration)
        )
    })

    return result
})

const fortuneShopData = computed(() => getFortuneShopData(token.value?.id))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(token.image.main.path)"></Config>

    <div>
        <back-button fallback="/search/tokens/" />
        <div v-if="token === null">
            Token {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="token">
                <template #image-right>
                    <InventoryAddButton :gameObject="token.id"></InventoryAddButton>
                </template>
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <!-- <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr> -->
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="fortuneShopData">
                <h2 class="h2">{{ $t('fortune_shop.title') }}</h2>
                <FortuneShopTable :prices="fortuneShopData.prices"></FortuneShopTable>
            </section>
            <section class="section" v-if="tasks.length">
                <h2 class="h2">{{ $t('tasks.task', 2) }}</h2>
                <div class="tasks">
                    <TaskInfo v-for="task in tasks" :task-id="task"></TaskInfo>
                </div>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

</style>

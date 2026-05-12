<script setup lang="ts">
import { computed } from 'vue';
import gameData from '@/scripts/gameData'
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


const pageContext = usePageContext()
const data = useData<{avatar: AvatarType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const avatar = computed(() => data.avatar)

const name = computed(() => {
    let name = gameData.translateName(avatar.value).value
    return name
})

const pony = computed(() => gameData.getObject(avatar.value.pony, 'pony'))

const fortuneShopData = computed(() => gameData.getFortuneShopData(avatar.value.id))

</script>

<template>
    <Config :title="name" description="" :image="absoluteUrl(staticImage(avatar.image.preview))"></Config>

    <div>
        <back-button fallback="/search/avatars" />
        <div v-if="avatar === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="avatar">
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.profile_decorations.is_default') }}</td>
                                <td>{{ avatar.is_default }}</td>
                            </tr>
                            <tr v-if="avatar.animated">
                                <td>{{ $t('game_object.profile_decorations.avatar.animated') }}</td>
                                <td>{{ avatar.animated }}</td>
                            </tr>
                            <tr v-if="pony != null">
                                <td>{{ $t('game_object.pony.pony') }}</td>
                                <td>
                                    <Link
                                        class="link"
                                        :href="`/pony/${pony.id}`"
                                    >
                                        {{ gameData.translateName(pony) }}
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">Price History</h2>
                <PriceHistory :object="avatar.id" :priceHistory="priceHistory"></PriceHistory>
            </section>
            <section class="section" v-if="fortuneShopData">
                <h2 class="h2">{{ $t('fortune_shop.title') }}</h2>
                <FortuneShopTable :prices="fortuneShopData.prices"></FortuneShopTable>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

</style>

<script setup lang="ts">
import { computed } from 'vue';
import gameData from '@/scripts/gameData'
import { language } from '@/globals';
import CurrencyImage from '@/components/CurrencyImage.vue'
import { staticImage } from '@/scripts/common'
import { formatTime } from '@/scripts/timeFunctions'
import StarRewards from '@/components/StarRewards.vue'
import BackButton from '@/components/buttons/BackButton.vue'
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue'
import { useSaveStore } from '@/stores/saveManager'
import Stars from '@/components/Stars.vue'
import { LOCATIONS } from '@/scripts/categories'
import { isClient, useArrayFilter, useMounted } from '@vueuse/core'
import { usePageContext } from 'vike-vue/usePageContext'
import Link from '@/components/Link.vue'
import { Config } from 'vike-vue/Config'
import absoluteUrl from '@/scripts/absoluteUrl'
import { useData } from 'vike-vue/useData'
import type { PonyType } from '@/types/gameDataTypes'
import PriceHistory from '@/components/tables/PriceHistory.vue'
import type { PriceHistoryType } from '@/scripts/api.types'
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()
const isMounted = useMounted()

const pageContext = usePageContext()

const saveStore = useSaveStore()

const data = useData<{pony: PonyType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const filteredPriceHistory = useArrayFilter(priceHistory, (item) => item.price.base.currency !== 'Lotto')

const pony = computed(() => data.pony)

const basePrice = computed(() => {
    const result = {
        token: pony.value.price?.token,
        tokens: null,
        currency: pony.value.price?.base.currency,
        price: pony.value.price?.base.amount,
        dailyGoals: pony.value.price?.daily_goals,
    }
    if (priceHistory.value.length) {
        result.currency = priceHistory.value[0].price.base.currency
        result.price = priceHistory.value[0].price.base.price
        result.tokens = priceHistory.value[0].price.base.tokens
    }
    if (result.currency == 'Lotto') {
        result.currency = null // hide "Lotto" prices
    }
    return result
})

const stars = computed({
  get() {
    if (!isMounted.value) {
        return 0
    }

    if (saveStore.hasPony(pony.value.id)) {
      return saveStore.ponies[pony.value.id].level
    } else {
      return 0
    }
  },
  set(stars: 0 | 1 | 2 | 3 | 4 | 5) {
    saveStore.addPony(pony.value.id, {
      level: stars,
    })
  }
})


const name = computed(() => {
    let name = gameData.translateName(pony.value).value
    return name
})

const description = computed(() => {
    let description = pony.value?.description[language.value.key]
    return description
})

const house = computed(() => gameData.getObject(pony.value?.house))
const houseName = computed(() => house.value?.name[language.value.key])

const fortuneShopData = computed(() => gameData.getFortuneShopData(pony.value.id))

const showProIcon = computed(() => {
    if (!pony.value.pro) {
        return false
    }
    if (pony.value.pro == 'random') {
        return true
    }
    if (!gameData.data.group_quests.quests[pony.value.pro].special) {
        return true
    }
    return false
})

const groupQuestName = computed(() => {
    if (!pony.value.pro) {
        return null
    }

    let name = pony.value.pro === 'random' ? t('group_quests.random_pro') : gameData.data.group_quests.quests[pony.value.pro].name[language.value.key]

    if (pony.value.pro != 'random') {
        let special = gameData.data.group_quests.quests[pony.value.pro].special
        switch (special) {
            case 'seasonal': name = t('group_quests.name_seasonal', {name}); break
            case 'tutorial':name = t('group_quests.name_tutorial', {name}); break
        }
    }

    return name
})

</script>

<template>
    <Config
        v-if="pony"
        :title="name"
        :description="description"
        :image="absoluteUrl(staticImage(pony?.image?.main))"
    >
    </Config>

    <div>
        <back-button fallback="/search/ponies" />
        <div v-if="!pony">
            Pony {{ pageContext.routeParams.id }} not found
        </div>
        <div v-else>
            <ObjectPage :gameObject="pony">
                <template #name>
                    <img class="portrait" :src="`/images/${pony.image.portrait}`" :alt="name">
                    {{ name }}
                </template>
                <template #image-left>
                    <img v-if="showProIcon" loading="lazy" src="@/assets/images/ui/pro-pony.png" />
                </template>
                <template #image-right>
                    <inventory-add-button :gameObject="pony.id"></inventory-add-button>
                </template>
                <template #image>
                    <div class="character-wrapper">
                        <div class="character-container">
                            <Stars
                                class="stars"
                                v-model="stars"
                                interractive
                            >
                                <img class="full-image" :src="staticImage(pony.image.main)" :alt="name">
                            </Stars>
                            <Link
                                v-if="pony.changeling.id"
                                :href="`/pony/${pony.changeling.id}/`"
                                class="button button-blue"
                            >
                                {{ $t('game_object.pony.transform') }}
                            </Link>
                        </div>
                    </div>
                </template>
                <template #left-info>
                    <div class="description">{{ description }}</div>
                </template>
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <Link :href="`https://mlp-game-wiki.no/wiki/${pony.wiki_path}`" class="link" target="_blank">
                                        {{ $t('common.wiki') }}
                                    </Link>
                                </td>
                            </tr>
                            <tr v-if="(basePrice.currency && basePrice.price) || (basePrice.token && basePrice.tokens)">
                                <td>{{ $t('common.price') }}</td>
                                <td>
                                    <template v-if="basePrice.token && basePrice.tokens">
                                        <CurrencyImage :object="basePrice.token">
                                            {{ $n(basePrice.tokens) }}
                                        </CurrencyImage>
                                        <template v-if="basePrice.currency && basePrice.price">
                                            {{}}
                                            {{ $t('common.or').toLocaleLowerCase() }} 
                                            {{}}
                                        </template>
                                    </template>
                                    <CurrencyImage v-if="basePrice.currency && basePrice.price" :object="basePrice.currency">
                                        {{ $n(basePrice.price) }}
                                    </CurrencyImage>
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.common.unlock_level') }}</td>
                                <td>{{ pony.unlock_level }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('location.town') }}</td>
                                <td>{{ $t(LOCATIONS[pony.location].string) }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.house.house') }}</td>
                                <td>
                                    <Link
                                        v-if="house !== null"
                                        class="link"
                                        :href="`/house/${house.id}`"
                                    >
                                        {{ houseName }}
                                    </Link>
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.pony.arrival_bonus') }}</td>
                                <td>
                                    <currency-image object="XP">
                                        {{ pony.arrival_xp }}
                                    </currency-image>
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.pony.minigame_cooldown') }}</td>
                                <td>{{ formatTime(pony.minigame.cooldown) }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.pony.minigame_skip_cost') }}</td>
                                <td>
                                    <currency-image object="Gems">
                                        {{ pony.minigame.skip_cost }}
                                    </currency-image>
                                </td>
                            </tr>
                            <tr v-if="groupQuestName">
                                   <td>{{ $t('group_quests.pro') }}</td>
                                   <td>{{ groupQuestName }}</td>
                            </tr>
                            <tr>
                                <td colspan="2" class="table-header">{{ $t('game_object.pony.level_up_rewards') }}</td>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <span v-if="pony.max_level || pony.rewards.length == 0" class="none-star-rewards">None</span>
                                    <star-rewards
                                        v-if="!pony.max_level && pony.rewards.length > 0"
                                        :rewards="pony.rewards"
                                        v-model="stars"
                                    ></star-rewards>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="filteredPriceHistory.length">
                <h2 class="h2">Price History</h2>
                <PriceHistory :object="pony.id" :priceHistory="filteredPriceHistory"></PriceHistory>
            </section>
            <section class="section" v-if="fortuneShopData">
                <h2 class="h2">{{ $t('fortune_shop.title') }}</h2>
                <FortuneShopTable :prices="fortuneShopData.prices"></FortuneShopTable>
            </section>
        </div>
    </div>
</template>

<style lang="css" scoped>

.portrait {
    height: 1em;
}

.full-image {
    /*max-height: 10rem;*/
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

.character-wrapper {
    align-items: start;
}

.character-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stars {
    width: 12rem;
    height: 13rem;
    font-size: 1.7rem;
}

.left-image-container,
.right-image-container {
    --width: 2rem;
    
    height: 100%;
    width: var(--width);
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-content: center;

    /* padding: 0.4rem 0.3rem; */
}
.left-image-container {
    left: 0;
}
.right-image-container {
    right: 0;
}

.left-image-container > *,
.right-image-container > * {
    width: var(--width);
    height: var(--width);
    /*aspect-ratio: 1 / 1;*/

    margin: 0;
}

</style>

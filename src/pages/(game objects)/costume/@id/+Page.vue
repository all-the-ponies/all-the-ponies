<script setup lang="ts">
import BackButton from '@/components/buttons/BackButton.vue';
import Link from '@/components/Link.vue';
import ObjectPage from '@/layouts/ObjectPage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { getObject, translateName } from '@/scripts/gameData';
import { computedAsync } from '@vueuse/core';
import { Config } from 'vike-vue/Config';
import { useData } from 'vike-vue/useData';
import { usePageContext } from 'vike-vue/usePageContext';
import { computed } from 'vue';
import type { Data } from './+data';
import ObjectImage from '@/components/ObjectImage.vue';
import CostumePartEntry from './CostumePartEntry.vue';


const pageContext = usePageContext()
const data = useData<Data>()

const costume = computed(() => data.costume)
const costumeParts = computed(() => data.parts)
const subsets = computed(() => data.subsets)

const name = translateName(costume)

const pony = computedAsync(async () => await getObject(costume.value?.pony, 'pony'))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(costume.image.main.path)"></Config>

    <div>
        <back-button fallback="/search/avatars" />
        <div v-if="costume === null">
            Costume {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="costume">
                <template #left-info v-if="costume.bonus.type">
                    <div class="bonus-info">
                        <img v-if="costume.bonus.type == 'MineCart'" src="@/assets/images/ui/icons/minecart-icon.png" alt="Minecart bonus">
                        <img v-if="costume.bonus.type == 'MiniGames'" src="@/assets/images/ui/icons/costume-minigame-boost.png" alt="Minigame bonus">
                        <img v-if="costume.bonus.type == 'ShopProduction'" src="@/assets/images/ui/icons/bits-boost.png" alt="Bits bonus">
                        +{{ $n(costume.bonus.amount / 100, {style: 'percent'}) }}
                    </div>
                </template>
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr>
                            <tr v-if="pony != null">
                                <td>{{ $t('game_object.pony.pony') }}</td>
                                <td>
                                    <Link
                                        class="link"
                                        :href="`/pony/${pony.id}`"
                                    >
                                        {{ translateName(pony) }}
                                    </Link>
                                </td>
                            </tr>
                            <tr v-if="costumeParts.mane">
                                <td colspan="2">
                                    <CostumePartEntry :costume-part="costumeParts.mane"></CostumePartEntry>
                                </td>
                            </tr>
                            <tr v-if="costumeParts.body">
                                <td colspan="2">
                                    <CostumePartEntry :costume-part="costumeParts.body"></CostumePartEntry>
                                </td>
                            </tr>
                            <tr v-if="costumeParts.tail">
                                <td colspan="2">
                                    <CostumePartEntry :costume-part="costumeParts.tail"></CostumePartEntry>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="subsets.length">
                <h2 class="h2">{{ $t('game_object.costume.collection') }}</h2>
                <div class="subsets">
                    <Link
                        v-for="subCostume in subsets"
                        :href="`/${subCostume.category}/${subCostume.id}`"
                        class="sub-costume link"
                    >
                        <img :class="{'costume-glow': subCostume.id === costume.id}" :src="createAssetUrl(subCostume.image.main.path)" :alt="translateName(subCostume).value" :title="translateName(subCostume).value">
                        <span class="sub-costume-name">{{ translateName(subCostume) }}</span>
                    </Link>
                </div>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

.bonus-info {
    font-size: 1.6rem;
    margin-block: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.bonus-info img {
    height: 1em;
    object-fit: contain;
    object-position: center;
}

.subsets {
    --item-width: 8rem;

    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--item-width), 1fr));
    /* grid-template-rows: subgrid; */
    gap: 0.8rem;
}

.sub-costume {
    display: grid;
    text-align: center;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    width: 100%;
    justify-items: center;
    align-items: stretch;
    
    img {
        object-fit: contain;
        object-position: center;
        width: var(--item-width);
    }
}

.costume-glow {
    filter: drop-shadow(0 0 0.75rem var(--orange));
}

</style>

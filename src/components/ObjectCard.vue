<script lang="ts" setup>
import VLazyImage from "v-lazy-image"
import { RouterLink } from 'vue-router'
import InventoryAddButton from "./buttons/InventoryAddButton.vue"

import gameData from '@/scripts/gameData'
import { computed, shallowRef } from 'vue'
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import { useSaveStore } from "@/stores/saveManager"
import { shopStore } from "@/stores/shopManager"
import { computedAsync } from "@vueuse/core"
import PriceButton from "./buttons/PriceButton.vue"
import RoyalIcon from "./icons/store/RoyalIcon.vue"
import ObjectImage from "./ObjectImage.vue"
import { valueExists } from "@/scripts/common"

const shopManager = shopStore

const props = defineProps<{
    object: GameObjectId | GameObject,
    showPrice?: boolean,
}>()

const saveStore = useSaveStore()

const gameObject = gameData.getObject(props.object)

const name = computed(() => {
    let name = gameData.translateName(gameObject).value
    return name
})

const image = 'preview' in gameObject.image ? gameObject.image.preview : gameObject.image.main

const canAdd = ['pony', 'shop'].includes(gameObject.category)

// const stars = computed({
//   get() {
//     if (saveStore.hasPony(gameObject.id)) {
//       return saveStore.ponies[gameObject.id].level
//     } else {
//       return 0
//     }
//   },
//   set(stars: 0 | 1 | 2 | 3 | 4 | 5) {
//     saveStore.addPony(gameObject.id, {
//       level: stars,
//     })
//   },
// })


const gettingShopInfo = shallowRef(false)

const shopInfo = computedAsync(
    async () => {
        // console.log('getting shop data for', gameObject.id)
        // return null
        return await shopManager.getShopInfo(gameObject)
    },
    null,
    { evaluating: gettingShopInfo, lazy: true, shallow: true },
)

const mainCurrency = computed(() => {
    if (gettingShopInfo.value) {
        return null
    }
    
    if (valueExists(shopInfo.value?.token) && (valueExists(shopInfo.value?.price.base.tokens) || valueExists(shopInfo.value?.price.sale.tokens))) {
        return shopInfo.value?.token
    } else if (valueExists(shopInfo.value?.price.sale.price) && valueExists(shopInfo.value?.inShop)) {
        return shopInfo.value?.price.sale.currency || null
    } else {
        return shopInfo.value?.price.base.currency || null
    }
})

const mainPrice = computed(() => {
    if (gettingShopInfo.value) {
        return null
    }

    if (valueExists(shopInfo.value?.token) && (valueExists(shopInfo.value?.price.base.tokens) || valueExists(shopInfo.value?.price.sale.tokens))) {
        return shopInfo.value?.price.base.tokens || shopInfo.value?.price.sale.tokens
    } else if (valueExists(shopInfo.value?.price.sale.price) && valueExists(shopInfo.value?.inShop)) {
        return shopInfo.value?.price.sale.price
    } else {
        return shopInfo.value?.price.base.price
    }
})

const replacedPrice = computed(() => {
    if (gettingShopInfo.value) {
        return null
    }

    if (valueExists(shopInfo.value?.price.sale.price) && valueExists(shopInfo.value?.inShop)) {
        return shopInfo.value?.price.base.price
    }

    return null
})

</script>

<template>
    <div class="object-card">
        <RouterLink :to="{
            name: gameObject.category,
            params: {
                id: gameObject.id,
            }
        }">
            <div class="banner" v-if="!gettingShopInfo && showPrice && shopInfo?.inShop">
                <span v-if="shopInfo?.price?.sale?.price" class="discount-banner">
                    {{
                        $n(
                            1 - shopInfo.price.sale.price / shopInfo.price.base.price,
                            { style: 'percent' },
                        )
                    }}
                    {{ $t('store.message.percent_off') }}
                </span>
                <span v-if="shopInfo?.price?.royal?.price" class="royal-banner">
                    <RoyalIcon class="royal-icon" />
                    {{
                        $n(
                            1 - shopInfo.price.royal.price / shopInfo.price.base.price,
                            { style: 'percent' },
                        )
                    }}
                </span>
            </div>
            <span class="object-name">
                {{ name }}
            </span>
            <div class="card-body">
                <v-lazy-image :src="`/images/${image}`" :alt="name" class="object-image" />
                <div class="left-container">
                    <img v-if="gameObject.category === 'pony' && gameObject.pro" loading="lazy" src="@/assets/images/ui/pro-pony.png" />
                    <!-- <v-lazy-image v-if="gameObject.category === 'pony' && gameObject.pro" loading="lazy" @intersect="this.src" :src="() => import('@/assets/images/ui/pro-pony.png')" /> -->
                </div>
                <div class="right-container">
                    <inventory-add-button v-if="canAdd" :gameObject="gameObject.id" />
                </div>
                <div class="info">
                    <slot name="info">
                        <template v-if="showPrice && !gettingShopInfo">
                            <template v-if="shopInfo?.inShop">
                                <div class="discount-container">
                                    <span v-if="replacedPrice != null && !(shopInfo?.token && shopInfo?.price?.base?.tokens)" class="replaced-price">{{ replacedPrice }}</span>
                                    <div v-if="shopInfo?.price?.royal?.price" class="royal-price">
                                        {{ $n(shopInfo.price.royal.price)}}
                                        <ObjectImage :object="shopInfo.price.royal.currency" />
                                        {{ $t('store.message.if') }}
                                        <img src="@/assets/images/ui/royal/royal-crown.png" loading="lazy"></img>
                                    </div>
                                </div>
                                <div v-if="(shopInfo?.token && shopInfo?.price?.base?.tokens) && shopInfo?.price?.sale?.price" class="token-discount">
                                    -{{ $n(1 - shopInfo?.price?.sale?.price / shopInfo?.price?.base?.price, { style: 'percent' }) }}
                                    {{ $t('store.message.for') }}
                                    <ObjectImage :object="shopInfo.price.sale.currency" />
                                </div>
                            </template>
                            <PriceButton v-if="props.showPrice" :currency="mainCurrency">{{ mainPrice != null ? $n(mainPrice) : '' }}</PriceButton>
                        </template>
                    </slot>
                </div>
            </div>
        </RouterLink>
    </div>
</template>

<style lang="css" scoped>
.object-card {
    margin-top: 0.8rem;
    
    left: 0px;
    background-color: white;

    width: var(--grid-size, 10rem);
    height: calc(var(--grid-size, 10rem) * (4 / 3));
    aspect-ratio: 3 / 4;

    border-radius: 0.8rem;
    --box-shadow: inset 0px -1px 4px hsl(211, 30%, 80%);
    box-shadow: var(--box-shadow);

    cursor: pointer;
    container-type: inline-size;
    text-decoration: none;

    transition: box-shadow 150ms ease-out,
                scale 150ms ease-out;
    
    position: relative;
}

.object-card:hover,
.object-card:focus {
    box-shadow: var(--box-shadow),
                0px 0px 5px hsl(211, 30%, 30%);
    scale: 105%;
}

.object-card:hover .add-button {
    visibility: visible;
}

a {
    border-radius: inherit;
    text-decoration: none;
}

.banner {
    position: absolute;
    top: -0.8rem;
    width: 100%;
    color: white;
    font-size: 0.7em;
}

.discount-banner {
    position: absolute;
    width: 80%;
    left: 50%;
    padding-inline: 1rem;
    text-align: center;

    transform: translate(-50%, 0);

    filter: drop-shadow(0px 2px 0px rgb(0 0 0 / 0.25));
}

.discount-banner:has(+ .royal-banner) {
    text-align: left;
}

.discount-banner::before {
    content: "";
    position: absolute;
    background: linear-gradient(0.25turn, hsl(351, 77%, 55%), hsl(348, 69%, 70%), hsl(351, 77%, 55%));
    z-index: -1;

    left: 0;
    top: 0;

    width: 100%;
    height: 100%;
    
    clip-path: shape(
        from 0% 0%,
        line to 100% 0%,
        line to calc(100% - 2px) 100%,
        line to 2px 100%,
        close
    );
}

.royal-banner {
    position: absolute;
    width: 30%;
    right: 0%;
    top: -1px;
    padding-inline: 0.1rem;
    text-align: center;

    /* transform: translate(-50%, 0); */

    filter: drop-shadow(0px 1px 0px rgb(0 0 0 / 0.25));
}

.royal-banner::before {
    content: "";
    position: absolute;
    background: linear-gradient(0.25turn, #622e5e, #9b4894, #622e5e);
    z-index: -1;

    left: 0;
    top: 0;

    width: 100%;
    height: 100%;
    
    clip-path: shape(
        from 0% 0%,
        line to 100% 0%,
        line to calc(100% - 0px) 100%,
        line to 2px 100%,
        close
    );
}

.royal-icon {
    position: absolute;
    height: 1.15rem;
    left: 0;
    top: -1px;
    transform: translate(-50%, 0);
}

.object-name {
    font-size: 10cqw;
    word-break: break-word;
    text-shadow: var(--text-shadow);

    color: white;
    text-align: center;
    display: grid;
    align-items: center;
    width: 100%;
    height: 20%;
    background-image: linear-gradient(var(--pink-light), var(--pink));
    /* box-shadow: 0px 1px 0px 1px var(--pink-dark); */
    border-bottom: 2px solid var(--pink-dark);
    
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

.card-body {
    padding: 0.4rem;
    width: 100%;
    height: 80%;
    position: relative;
    display: grid;
    grid-template-rows: 100%;
}

.object-image-container {
    width: 100%;
    height: 100%;
}

.object-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    padding: 0.3rem;
}

.left-container,
.right-container {
    height: 100%;
    width: 2rem;
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-content: center;

    padding: 0.4rem 0.3rem;
}
.left-container {
    left: 0;
}
.right-container {
    right: 0;
}

.left-container > *,
.right-container > * {
    width: 1.5rem;
    height: 1.5rem;

    margin: 0;
}

.info:has(> *) {
    width: 100%;
    /* height: 30%; */
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    /* padding: 0.5rem; */
}

.card-body:has(.info *) {
    /* height: 70%; */
    grid-template-rows: 75% 25%;
}

.discount-container {
    position: absolute;
    bottom: 90%;
    width: 100%;
    left: 0;
    /* height: max-content; */
    text-align: center;
    padding-inline: 1.2rem;
}

.discount-container:has(.royal-price) {
    text-align: left;
}

.replaced-price {
    font-size: 0.6em;
    color: black;
    position: relative;
    /* top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); */
}

.replaced-price::after {
    content: "";
    width: 3rem;
    height: 2px;
    background-color: red;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-16deg);
}

.royal-price {
    position: absolute;
    right: -0.5rem;
    bottom: 0;
    aspect-ratio: 259 / 96;
    width: 5rem;
    height: 1.85rem;
    padding-left: 0.8rem;
    padding-top: 0.2rem;
    
    font-size: 0.8rem;
    color: white;


    display: flex;
    align-items: center;
    justify-content: space-evenly;
    
    background-image: url('@/assets/images/ui/store/royal-sale-price.png');
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
}

.royal-price img {
    height: 1.5em;
}

.token-discount {
    position: absolute;
    bottom: 75%;
    background-image: url('@/assets/images/ui/store/token-price-popup.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;

    width: 5.5rem;
    height: 2.1rem;
    aspect-ratio: 248 / 112;
    padding-bottom: 0.5rem;
    padding-top: 0.1rem;

    color: white;
    font-size: 0.8rem;
    text-align: center;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
}

.token-discount img {
    height: 1.2rem;
    align-self: center;
}
</style>

import { useSaveStore } from "@/stores/saveManager";
import type { _DeepPartial } from "pinia";
import { computed, reactive, type ComputedRef, type Reactive, type Ref } from "vue";
import gameData from "./gameData";
import type { GameObjectId } from "@/types/gameDataTypes";

const save = useSaveStore()

interface SaveStats {
    readonly ponies: {
        readonly total: number,
        readonly unique: number,
        readonly regular: number,
        readonly changelings: number,
        readonly gems: number,
        readonly groups: number,
        readonly stars: number,
    },
    readonly houses: {
        readonly total: number,
    },
    readonly shops: {
        readonly total: number,
        readonly bits: number,
        readonly gems: number,
        readonly others: number,
    },
}

type ToReactive<T> = T extends object
                    ? Ref<ReactiveObject<T>> | ReactiveObject<T>
                    : Ref<T> | T

type ReactiveObject<T> = { [K in keyof T]: ToReactive<T[K]> }

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

const ponies = computed(() => {
    const changelingTransformations: GameObjectId[] = []
    
    const ponies: DeepWriteable<SaveStats['ponies']> = {
        total: 0,
        unique: 0,
        regular: 0,
        changelings: 0,
        gems: 0,
        groups: 0,
        stars: 0,
    }

    for (let [ponyId, ponyInfo] of Object.entries(save.ponies)) {
        const pony = gameData.getObject(ponyId, 'pony')
        if (!pony) {
            continue
        }
        ponies.total++
        if (pony.group.length > 0 && !pony.group_master) {
            continue
        } else if (pony.group.length > 0) {
            ponies.groups++
        } else if (pony.changeling.id) {
            if (changelingTransformations.includes(ponyId)) {
                ponies.changelings++
                continue
            } else {
                changelingTransformations.push(pony.changeling.id)
            }
        } else {
            ponies.regular++
        }

        ponies.stars += ponyInfo.level
        ponies.unique++
    }

    return ponies
})

const shops = computed(() => {
    const shops: DeepWriteable<SaveStats['shops']> = {
        total: 0,
        bits: 0,
        gems: 0,
        others: 0,
    }

    for (let shopId of Object.keys(save.shops)) {
        const shop = gameData.getObject(shopId, 'shop')

        shops.total++
        if (shop.product.bits > 0) {
            shops.bits++
        } else if (shop.product.gems > 0) {
            shops.gems++
        } else {
            shops.others++
        }
    }

    return shops
})

const saveStats = reactive<ReactiveObject<SaveStats>>({
    ponies,
    houses: {
        total: computed(() => save.houses.size),
    },
    shops,
}) as SaveStats

export default saveStats

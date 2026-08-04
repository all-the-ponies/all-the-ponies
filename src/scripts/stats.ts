import { useSaveStore } from "@/stores/saveManager"
import type { GameObjectId } from "@/types/gameDataTypes"
import { computed, onMounted, reactive, shallowRef, type Ref } from "vue"
import { getCollection, getObject } from "./gameData"


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
    readonly costumes: {
        readonly total: number,
    },
    readonly collections: {
        readonly total: number,
    },
}

type ToReactive<T> = T extends object
                    ? Ref<ReactiveObject<T>> | ReactiveObject<T>
                    : Ref<T> | T

type ReactiveObject<T> = { [K in keyof T]: ToReactive<T[K]> }

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

const ponies = computed(() => {
    const save = useSaveStore()
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
        const pony = getObject(ponyId, 'pony')
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
    const save = useSaveStore()
    const shops: DeepWriteable<SaveStats['shops']> = {
        total: 0,
        bits: 0,
        gems: 0,
        others: 0,
    }

    for (let shopId of Object.keys(save.shops)) {
        const shop = getObject(shopId, 'shop')
        const product = getObject(shop.product, 'consumable')

        shops.total++
        if (product?.consume.bits > 0) {
            shops.bits++
        } else if (product?.consume.gems > 0) {
            shops.gems++
        } else {
            shops.others++
        }
    }

    return shops
})

export function useSaveStats() {
    const saveStats = shallowRef<SaveStats>(null)

    onMounted(() => {
        saveStats.value = reactive<ReactiveObject<SaveStats>>({
            ponies,
            houses: {
                total: computed(() => {
                    const save = useSaveStore()
                    return save.houses.size
                }),
            },
            shops,
            costumes: {
                total: computed(() => {
                    const save = useSaveStore()
                    const costumeSets = new Set<string>()
                    const costumes = new Set<string>()

                    for (let costumeId of save.costumes) {
                        if (costumeSets.has(costumeId)) {
                            continue
                        }

                        const costume = getObject(costumeId, 'costume')
                        if (costume.subsets?.length) {
                            costume.subsets.forEach(set => costumeSets.add(set))
                        }

                        costumes.add(costumeId)
                    }
        
                    return costumes.size
                })
            },
            collections: {
                total: computed(() => {
                    const save = useSaveStore()
                    const collections = [...save.collections]

                    collections.filter(collectionId => {
                        const collection = getCollection(collectionId)
                        return !(collection.tags?.includes('unused') || collection.tags?.includes('vip'))
                    })

                    return collections.length
                })
            }
        }) as SaveStats
    })
    
    return saveStats
}

// const saveStats = reactive<ReactiveObject<SaveStats>>({
//     ponies,
//     houses: {
//         total: computedAsync(async () => {
//     //         const save = useSaveStore()
//     //         return (await save.houses).size
//                 return 0
//         }, 0, {lazy: true}),
//     },
//     shops,
// }) as SaveStats
// 
// export default saveStats

import { useSaveStore } from "@/stores/saveManager"
import type { CategoryName, GameObjectId, PlayerStatName } from "@/types/gameDataTypes"
import { computed, onMounted, reactive, shallowRef, type Ref } from "vue"
import { getCollection, getObject, getTaskInfo } from "./gameData"
import poniesImage from '@/assets/images/ui/player-card/stat/stat-ponies.png'
import transformablesImage from '@/assets/images/ui/player-card/stat/stat-transformables.png'
import shopsImage from '@/assets/images/ui/player-card/stat/stat-shops.png'
import gemShopImage from '@/assets/images/ui/player-card/stat/stat-gem-shops.png'
import costumesImage from '@/assets/images/ui/player-card/stat/stat-costumes.png'
import collectionsImage from '@/assets/images/ui/player-card/stat/stat-collections.png'
import whCollectionsImage from '@/assets/images/ui/player-card/stat/stat-wh-collections.png'
import type { CollectionStats, CostumeStats, HouseStats, PonyStats, ShopStats, Stats } from "@/types/statsTypes"


export interface PlayerStatInfo {
    image: string,
    string: string,
    alt: string,
}

// Importing just gets the path to the image, it doesn't load the image data
export const statNameMap: Record<PlayerStatName, PlayerStatInfo> = {
  pony: {
    image: poniesImage,
    string: "game_object.pony.pony",
    alt: "player_card.player_stat.ponies",
  },
  pony_alt: {
    image: transformablesImage,
    string: "game_object.pony.transformable",
    alt: "player_card.player_stat.transformables",
  },
  shop: {
    image: shopsImage,
    string: "game_object.shop.shop",
    alt: "player_card.player_stat.shops",
  },
  gem_shop: {
    image: gemShopImage,
    string: "game_object.shop.gem_shop",
    alt: "player_card.player_stat.gem_shops",
  },
  costume: {
    image: costumesImage,
    string: "game_object.costume.costume",
    alt: "player_card.player_stat.costumes",
  },
  collection: {
    image: collectionsImage,
    string: "collection.collection",
    alt: "player_card.player_stat.collections",
  },
  hots: {
    image: whCollectionsImage,
    string: "inventory.stats.wh_collections",
    alt: "player_card.player_stat.wh_collections",
  },
}


type ToReactive<T> = T extends object
                    ? Ref<ReactiveObject<T>> | ReactiveObject<T>
                    : Ref<T> | T

type ReactiveObject<T> = { [K in keyof T]: ToReactive<T[K]> }

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

/**
 * Calculate stats for input objects. This filters out things that aren't obtainable
 * so the total count would be the most realistic total. This tries to be accurate to the game,
 * but it may still filter out more or less than what the game does (the game doesn't have
 * the concept of unused ponies).
 * @param objects Lists of object ids to stat
 * @returns {Stats}
 */
export function calculateStats(objects: {
    ponies: GameObjectId[],
    houses: GameObjectId[],
    shops: GameObjectId[],
    costumes: GameObjectId[],
    collections: string[],
}): Stats {
    return {
        ponies: countPonies(objects.ponies || []),
        houses: countHouses(objects.houses || []),
        shops: countShops(objects.shops || []),
        costumes: countCostumes(objects.costumes || []),
        collections: countCollections(objects.collections || []),
    }
}

function countPonies(ponies: GameObjectId[]): PonyStats {
    const stats: PonyStats = {
        total: 0,
        unique: 0,
        regular: 0,
        changelings: 0,
        gemCollectors: 0,
        bitCollectors: 0,
        tokenCollectors: 0,
        groups: 0,
        stars: 0,
    }
    const changelingTransformations: GameObjectId[] = []

    for (let ponyId of ponies) {
        const pony = getObject(ponyId, 'pony')
        if (!pony) {
            continue
        }
        if (pony.tags.includes('npc') || pony.tags.includes('unused') || pony.tags.includes('quest')) {
            continue
        }

        stats.total++
        if (pony.group.length > 0 && !pony.group_master) {
            continue
        } else if (pony.group.length > 0) {
            stats.groups++
        } else if (pony.changeling.id) {
            if (changelingTransformations.includes(ponyId)) {
                stats.changelings++
                continue
            } else {
                changelingTransformations.push(pony.changeling.id)
            }
        } else {
            stats.regular++
        }

        if (pony.tasks) {
            for (let taskId of pony.tasks) {
                const task = getTaskInfo(taskId)
                if (!task) {
                    continue
                }
                if (task.reward.gems) {
                    stats.gemCollectors++
                }
                if (task.reward.bits) {
                    stats.bitCollectors++
                }
                if (task.reward.token) {
                    stats.tokenCollectors++
                }
            }
        }

        // stats.stars += ponyInfo.level
        stats.unique++
    }

    return stats
}

function countHouses(houses: GameObjectId[]): HouseStats {

}

function countShops(shops: GameObjectId[]): ShopStats {
    const save = useSaveStore()
    const stats: ShopStats = {
        total: 0,
        bits: 0,
        gems: 0,
        critters: 0,
        feeds: 0,
        others: 0,
    }

    for (let shopId of shops) {
        const shop = getObject(shopId, 'shop')
        const product = getObject(shop.product, 'consumable')

        stats.total++
        if (product?.consume.bits > 0) {
            stats.bits++
        } else if (product?.consume.gems > 0) {
            stats.gems++
        } else {
            stats.others++
        }
    }

    return stats
}

function countCostumes(costumes: GameObjectId[]): CostumeStats {
    
}

function countCollections(collections: string[]): CollectionStats {

}

const ponies = computed(() => {
    const save = useSaveStore()
    const changelingTransformations: GameObjectId[] = []
    
    const ponies: DeepWriteable<Stats['ponies']> = {
        total: 0,
        unique: 0,
        regular: 0,
        changelings: 0,
        gemCollectors: 0,
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
    const shops: DeepWriteable<Stats['shops']> = {
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
    const saveStats = shallowRef<Stats>(null)

    onMounted(() => {
        saveStats.value = reactive<ReactiveObject<Stats>>({
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
        }) as Stats
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

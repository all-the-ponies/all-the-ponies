import { useSaveStore } from "@/stores/saveManager"
import type { CategoryName, GameObjectId, PlayerStatName } from "@/types/gameDataTypes"
import { computed, onMounted, reactive, ref, shallowRef, type Ref } from "vue"
import { getCollection, getCollectionData, getGameObjects, getGroupQuestInfo, getObject, getTaskInfo } from "./gameData"
import poniesImage from '@/assets/images/ui/player-card/stat/stat-ponies.png'
import transformablesImage from '@/assets/images/ui/player-card/stat/stat-transformables.png'
import shopsImage from '@/assets/images/ui/player-card/stat/stat-shops.png'
import gemShopImage from '@/assets/images/ui/player-card/stat/stat-gem-shops.png'
import costumesImage from '@/assets/images/ui/player-card/stat/stat-costumes.png'
import collectionsImage from '@/assets/images/ui/player-card/stat/stat-collections.png'
import whCollectionsImage from '@/assets/images/ui/player-card/stat/stat-wh-collections.png'
import bitPoniesImage from '@/assets/images/ui/player-card/stat/stat-bit-ponies.png'
import bitShopsImage from '@/assets/images/ui/player-card/stat/stat-bit-shops.png'
import crittersImage from '@/assets/images/ui/player-card/stat/stat-critters.png'
import gemPoniesImage from '@/assets/images/ui/player-card/stat/stat-gem-ponies.png'
import starsImage from '@/assets/images/ui/player-card/stat/stat-pony-stars.png'
import proPoniesImage from '@/assets/images/ui/player-card/stat/stat-pro-ponies.png'

import type { CollectionStats, CostumeStats, HouseStats, PonyStats, ShopStats, Stats } from "@/types/statsTypes"
import { useMounted } from "@vueuse/core"
import { watchEffect } from "vue"


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
  bit_ponies: {
    image: bitPoniesImage,
    string: "inventory.stats.bit_ponies",
    alt: "inventory.stats_alt.bit_ponies",
  },
  bit_shops: {
    image: bitShopsImage,
    string: "inventory.stats.bit_shops",
    alt: "inventory.stats_alt.bit_shops",
  },
  critters: {
    image: crittersImage,
    string: "inventory.stats.critters",
    alt: "inventory.stats_alt.critters",
  },
  gem_ponies: {
    image: gemPoniesImage,
    string: "inventory.stats.gem_ponies",
    alt: "inventory.stats_alt.gem_ponies",
  },
  stars: {
    image: starsImage,
    string: "inventory.stats.stars",
    alt: "inventory.stats_alt.stars",
  },
  pro_ponies: {
    image: proPoniesImage,
    string: "inventory.stats.pro_ponies",
    alt: "inventory.stats_alt.pro_ponies",
  }
}


type ToReactive<T> = T extends object
                    ? Ref<ReactiveObject<T>> | ReactiveObject<T>
                    : Ref<T> | T

type ReactiveObject<T> = { [K in keyof T]: ToReactive<T[K]> }

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

interface PonyStatInput {
    id: GameObjectId,
    level?: number,
}
const MAX_PONY_LEVEL = 5

/**
 * Calculate stats for input objects. This filters out things that aren't obtainable
 * so the total count would be the most realistic total. This tries to be accurate to the game,
 * but it may still filter out more or less than what the game does (the game doesn't have
 * the concept of unused ponies).
 * @param objects Lists of object ids to stat
 * @returns {Stats}
 */
export function calculateStats(objects: {
    ponies: PonyStatInput[],
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

function countPonies(ponies: PonyStatInput[]): PonyStats {
    const stats: PonyStats = {
        total: 0,
        unique: 0,
        regular: 0,
        changelings: 0,
        gemCollectors: 0,
        bitCollectors: 0,
        tokenCollectors: 0,
        critters: 0,
        groups: 0,
        pros: 0,
        stars: 0,
    }
    const changelingTransformations: GameObjectId[] = []
    const critters: GameObjectId[] = []

    for (let {id: ponyId, level} of ponies) {
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
        } else if (pony.critter_farm) {
            if (critters.includes(ponyId)) {
                continue
            } else if (pony.changeling.id) {
                stats.critters++
                critters.push(pony.changeling.id)
            }
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

        if (pony.pro) {
            for (let questId in pony.pro) {
                if (questId == 'random') {
                    stats.pros++
                    break
                }
                const questInfo = getGroupQuestInfo(questId)
                if (!questInfo) {
                    continue
                }
                if (!questInfo.special) {
                    stats.pros++
                    break
                }
            }
        }

        stats.stars += level ?? MAX_PONY_LEVEL
        stats.unique++
    }

    console.log('transformables', changelingTransformations)

    return stats
}

function countHouses(houses: GameObjectId[]): HouseStats {
    return {
        total: houses.length
    }
}

function countShops(shops: GameObjectId[]): ShopStats {
    const stats: ShopStats = {
        total: 0,
        mainTotal: 0,
        bits: 0,
        gems: 0,
        critters: 0,
        feeds: 0,
        maze: 0,
        others: 0,
    }

    for (let shopId of shops) {
        const shop = getObject(shopId, 'shop')
        if (!shop) {
            continue
        }
        const product = getObject(shop.product, 'consumable')

        

        stats.total++
        if (product?.consume.bits > 0) {
            stats.bits++
            stats.mainTotal++
        } else if (product?.consume.gems > 0) {
            stats.gems++
        } else if (product?.consume.tls > 0) {
            stats.maze++
        } else if (product?.critter) {
            stats.critters++
            stats.mainTotal++
        } else if (product?.farm) {
            stats.feeds++
            stats.mainTotal++
        } else {
            stats.others++
            if (shop.special == 'ferris_wheel') {
                stats.mainTotal++
            }
        }
    }

    return stats
}

function countCostumes(costumes: GameObjectId[]): CostumeStats {
    const stats: CostumeStats = {
        total: 0,
    }
    const costumeSets = new Set<string>()

    for (let costumeId of costumes) {
        if (costumeSets.has(costumeId)) {
            continue
        }

        const costume = getObject(costumeId, 'costume')
        if (!costume) {
            continue
        }
        if (costume.subsets?.length) {
            costume.subsets.forEach(set => costumeSets.add(set))
        }

        stats.total++
    }

    return stats
}

function countCollections(collections: string[]): CollectionStats {

    const filtered = collections.filter(collectionId => {
        const collection = getCollection(collectionId)
        return !(collection?.tags?.includes('unused') || collection?.tags?.includes('vip'))
    })

    return {
        total: filtered.length
    }
}


export function useSaveStats() {
    const saveStats = shallowRef<Stats>(null)
    
    onMounted(() => {
        const save = useSaveStore()

        watchEffect(() => {
            saveStats.value = calculateStats({
                ponies: Object.entries(save.ponies).map(([id, info]) => ({id, level: info.level})),
                houses: [...save.houses],
                shops: Object.keys(save.shops),
                costumes: [...save.costumes],
                collections: [...save.collections],
            })
        })
    })

    return saveStats
}

const gameObjects = getGameObjects()
const collectionData = getCollectionData()

export const totalStats = calculateStats({
    ponies: Object.keys(gameObjects.pony.objects).map((id) => ({id})),
    houses: Object.keys(gameObjects.house.objects),
    shops: Object.keys(gameObjects.shop.objects),
    costumes: Object.keys(gameObjects.costume.objects),
    collections: Object.keys(collectionData.collections),
})

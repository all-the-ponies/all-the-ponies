import { FRIEND_CODE_PATTERN } from "@/globals/constants"
import api from "@/scripts/api"
import type { PlayerStatName } from "@/scripts/api.types"
import { notNullIsh } from "@/scripts/common"
import { extendedDeserialize, extendedSerialize } from "@/scripts/extendedSerialize"
import { getCollectionData, getGameObjects, getObject } from "@/scripts/gameData"
import type { TDateISO } from "@/types/date"
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import type { HTTPError } from "ky"
import { defineStore } from "pinia"
import { computed, shallowRef, toValue, watchEffect, type MaybeRef } from "vue"


interface GenericInventoryEntry {
    id: string,
}

interface PonyInventoryEntry extends GenericInventoryEntry {
    level: 0 | 1 | 2 | 3 | 4 | 5 | null,
    minigame: string,
}

interface ShopInventoryEntry extends GenericInventoryEntry {
    timeReduction: number,
    bitsBoost: number,
}

interface DecorInventoryEntry extends GenericInventoryEntry {
    count: number,
}


function createBaseSave() {
    return {
        playerInfo: {
            friendCode: '',
            joinDate: null as TDateISO | null,
            totalPlaytime: 0,
            level: 0,
            xp: 0,
            required_xp: 0,
            currency: {
                gems: 0,
                bits: 0,
            },
            player_card: {
                name: {
                    left: '',
                    right: '',
                },
                display_stats: {
                    left: null as PlayerStatName,
                    right: null as PlayerStatName,
                },
                avatar: null,
                avatar_frame: null,
                background: null,
                background_frame: null,
                cutie_mark: null,
            },
            stats: {
                whCollections: 0,
            }
        },
        ponies: {} as Record<GameObjectId, PonyInventoryEntry>,
        shops: {} as Record<GameObjectId, ShopInventoryEntry>,
        decor: {} as Record<GameObjectId, DecorInventoryEntry>,
        costumeParts: new Set<GameObjectId>(),
        avatars: new Set<GameObjectId>(),
        avatarFrames: new Set<GameObjectId>(),
        backgrounds: new Set<GameObjectId>(),
        backgroundFrames: new Set<GameObjectId>(),
        cutieMarks: new Set<GameObjectId>(),
        notes: {} as Record<GameObjectId, string>,
        critters: {} as Record<GameObjectId, number>,
    }
}


export const useSaveStore = defineStore('save', {
    state: () => {
        return createBaseSave()
    },
    getters: {
        houses: (state) => {
            const houses: Set<GameObjectId> = new Set()
            for (let ponyId of Object.keys(state.ponies)) {
                const pony = getObject(ponyId, 'pony')
                if (pony != null && !houses.has(pony.house)) {
                    houses.add(pony.house)
                }
            }

            return houses
        },
        costumes: (state) => {
            const costumes = new Set(
                Object.values(getGameObjects().costume.objects).filter(
                    costume => Object.values(costume.parts).every(
                        part => !part || state.costumeParts.has(part)
                    )
                ).map(costume => costume.id)
            )

            console.log('costumes', costumes)

            return costumes
        },

        // Making these getters allows them to be reactive
        hasPony: (state) => {
            return (id: GameObjectId) => id in state.ponies
        },
        hasShop: (state) => {
            return (id: GameObjectId) => id in state.shops
        },
        hasHouse() {
            return (id: GameObjectId) => id in this.houses
        },

        collections() {
            const collectionData = getCollectionData()
            const collections: Set<string> = new Set()
            for (let collection of Object.values(collectionData.collections)) {
                if (collection.ponies.every(item => {
                    const pony = getObject(item.item, 'pony')
                    if (pony.critter_farm) {
                        return this.critters[pony.critter_farm] >= item.count
                    }
                    return item.item in this.ponies || (item.alt && item.alt in this.ponies)
                })) {
                    collections.add(collection.id)
                }
            }
            return collections
        }
    },
    actions: {
        addPony(id: GameObjectId | GameObject, info: Partial<Omit<PonyInventoryEntry, 'id'>> = {}, state: Record<GameObjectId, PonyInventoryEntry> = null) {
            const pony = getObject(id, 'pony')
            if (pony === null) {
                throw TypeError(`Invalid pony id: ${id}`)
            }

            const ponyInfo: PonyInventoryEntry = {
                id: pony.id,
                level: pony.max_level ? 5 : info.level || 0,
                minigame: info.minigame || '',
            }

            const ponies = state || this.ponies

            if (pony.changeling.id) {
                const changelingPony = getObject(pony.changeling.id, 'pony')
                if (changelingPony.max_level) {
                    ponyInfo.level = 5
                }

                if (changelingPony.id in ponies && notNullIsh(info.level)) {
                    ponies[changelingPony.id] = {
                        ...ponyInfo,
                        id: changelingPony.id,
                    }
                }
            }

            if (pony.group.length) {
                for (let friend of pony.group) {
                    ponies[friend] = {
                        ...ponyInfo,
                        id: friend,
                    }
                }
            }

            ponies[pony.id] = ponyInfo
        },
        addShop(id: GameObjectId, info: Partial<Omit<ShopInventoryEntry, 'id'>> = {}, state: Record<GameObjectId, ShopInventoryEntry> = null) {
            const shop = getObject(id, 'shop')
            if (shop === null) {
                throw TypeError(`Invalid shop id: ${id}`)
            }

            const shopInfo: ShopInventoryEntry = {
                id: id,
                timeReduction: info.timeReduction || 0,
                bitsBoost: info.bitsBoost || 0,
            }

            const shops = state || this.shops

            shops[id] = shopInfo
        },

        // hasPony(id: GameObjectId) {
        //     console.log(this.ponies)
        //     return id in this.ponies
        // },
        // hasShop(id: GameObjectId) {
        //     return id in this.shops
        // },
        // hasHouse(id: GameObjectId) {
        //     return id in this.houses
        // },

        removePony(id: GameObjectId) {
            if (id in this.ponies) {
                const pony = getObject(id, 'pony')
                delete this.ponies[id]
                if (pony.group.length) {
                    for (let friend of pony.group) {
                        if (friend in this.ponies) {
                            delete this.ponies[friend]
                        }
                    }
                }
            }
        },
        removeShop(id: GameObjectId) {
            if (id in this.shops) {
                delete this.shops[id]
            }
        },

        addCostume(id: GameObjectId) {
            const costume = getObject(id, 'costume')
            if (!costume) {
                return
            }

            Object.values(costume.parts).forEach(part => {
                if (part) {
                    this.costumeParts.add(part)
                }
            })
        },
        removeCostume(id: GameObjectId) {
            const costume = getObject(id, 'costume')
            if (!costume) {
                return
            }

            Object.values(costume.parts).forEach(part => {
                if (part) {
                    this.costumeParts.delete(part)
                }
            })
        },

        async loadFromCloud(friendCode: string) {
            friendCode = friendCode.trim().toLocaleLowerCase()
            if (!FRIEND_CODE_PATTERN.test(friendCode)) {
                throw new Error(`Invalid friend code "${friendCode}"`)
            }
            
            const saveData = await api.getSave(friendCode).catch(async (error: HTTPError) => {
                if (error.response) {
                    throw new Error(await error.response.text())
                } else {
                    throw error
                }
            })

            console.log('saveData', saveData)

            
            const newSave = createBaseSave()

            newSave.playerInfo.friendCode = friendCode
            newSave.playerInfo.joinDate = saveData.player_info.join_date
            newSave.playerInfo.totalPlaytime = saveData.player_info.total_playtime
            newSave.playerInfo.currency.gems = saveData.player_info.currency.gems
            newSave.playerInfo.currency.bits = saveData.player_info.currency.bits
            newSave.playerInfo.level = saveData.player_info.level
            newSave.playerInfo.xp = saveData.player_info.xp
            newSave.playerInfo.required_xp = saveData.player_info.required_xp
            newSave.playerInfo.player_card.avatar = saveData.player_info.player_card.avatar
            newSave.playerInfo.player_card.avatar_frame = saveData.player_info.player_card.avatar_frame
            newSave.playerInfo.player_card.background = saveData.player_info.player_card.background
            newSave.playerInfo.player_card.background_frame = saveData.player_info.player_card.background_frame
            newSave.playerInfo.player_card.cutie_mark = saveData.player_info.player_card.cutie_mark
            newSave.playerInfo.player_card.name = saveData.player_info.player_card.name
            newSave.playerInfo.player_card.display_stats.left = saveData.player_info.player_card.display_stats.left
            newSave.playerInfo.player_card.display_stats.right = saveData.player_info.player_card.display_stats.right

            newSave.playerInfo.stats.whCollections = saveData.stats.wh_collections

            let ponies = Array.isArray(saveData.inventory.ponies) ? saveData.inventory.ponies : Object.values(saveData.inventory.ponies)

            for (let pony of ponies) {
                const ponyInfo = getObject(pony.id, 'pony')
                
                if (
                    ponyInfo.tags.includes('npc') ||
                    ponyInfo.tags.includes('quest') ||
                    (ponyInfo.group.length && !ponyInfo.group_master)
                ) {
                    continue
                }

                await this.addPony(ponyInfo, {
                    level: pony.level,
                }, newSave.ponies)
            }

            for (let shop of saveData.inventory.shops) {
                try {
                    this.addShop(shop, {}, newSave.shops)
                } catch (error) {
                    console.error(error)
                }
            }

            newSave.critters = Object.fromEntries(
                Object.entries(saveData.inventory.critters)
                .map(([critter, count]) => [getObject(critter, 'pony').critter_farm, count])
            )
            newSave.costumeParts = new Set(saveData.inventory.costume_parts)

            this.$state = newSave

            this.$persist()
        },
    },
    persist: [
        {
            pick: ['playerInfo'],
            key: 'player_info',
        },
        {
            pick: ['ponies'],
            key: 'ponies',
        },
        {
            pick: ['shops'],
            key: 'shops',
        },
        {
            pick: ['avatars', 'avatarFrames', 'backgrounds', 'backgroundFrames', 'cutieMarks'],
            key: 'profile_decorations',
            serializer: {
                serialize: extendedSerialize,
                deserialize: extendedDeserialize,
            },
        },
        {
            pick: ['costumeParts'],
            key: 'costume_parts',
            serializer: {
                serialize: extendedSerialize,
                deserialize: extendedDeserialize,
            },
        },
        {
            pick: ['critters'],
            key: 'critters'
        },
        {
            pick: ['notes'],
            key: 'notes',
        },
    ],
})

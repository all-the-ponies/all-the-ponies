import { FRIEND_CODE_PATTERN } from "@/globals/constants"
import api from "@/scripts/api"
import { notNullIsh } from "@/scripts/common"
import { getObject } from "@/scripts/gameData"
import type { TDateISO } from "@/types/date"
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import type { HTTPError } from "ky"
import { defineStore } from "pinia"
import { computed } from "vue"


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

export const useSaveStore = defineStore('save', {
    state: () => {
        return {
            playerInfo: {
                friendCode: '',
                joinDate: null as TDateISO | null,
                totalPlaytime: 0,
                currency: {
                    gems: 0,
                    bits: 0,
                }
            },
            ponies: {} as Record<GameObjectId, PonyInventoryEntry>,
            shops: {} as Record<GameObjectId, ShopInventoryEntry>,
            decor: {} as Record<GameObjectId, DecorInventoryEntry>,
            avatars: new Set<GameObjectId>(),
            avatarFrames: new Set<GameObjectId>(),
            backgrounds: new Set<GameObjectId>(),
            backgroundFrames: new Set<GameObjectId>(),
            notes: {} as Record<GameObjectId, string>,
        }
    },
    getters: {
        houses: async (state) => {
            const houses: Set<GameObjectId> = new Set()
            for (let ponyId of Object.keys(state.ponies)) {
                const pony = await getObject(ponyId, 'pony')
                if (pony != null && !houses.has(pony.house)) {
                    houses.add(pony.house)
                }
            }

            return houses
        },

        // Making these getters allows them to be reactive
        hasPony: (state) => {
            return (id: GameObjectId) => id in state.ponies
        },
        hasShop: (state) => {
            return (id: GameObjectId) => id in state.shops
        },
        hasHouse() {
            return async (id: GameObjectId) => id in await this.houses
        },
    },
    actions: {
        async addPony(id: GameObjectId | GameObject, info: Partial<Omit<PonyInventoryEntry, 'id'>> = {}, state: Record<GameObjectId, PonyInventoryEntry> = null) {
            const pony = await getObject(id, 'pony')
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
                const changelingPony = await getObject(pony.changeling.id, 'pony')
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
        async addShop(id: GameObjectId, info: Partial<Omit<ShopInventoryEntry, 'id'>> = {}, state: Record<GameObjectId, ShopInventoryEntry> = null) {
            const shop = await getObject(id, 'shop')
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

        async removePony(id: GameObjectId) {
            if (id in this.ponies) {
                const pony = await getObject(id, 'pony')
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

        async ownedRef(id: GameObjectId) {
            const gameObject = await getObject(id)
            switch (gameObject.category) {
                case 'pony':
                    return computed(() => id in this.ponies)
                case 'shop':
                    return computed(() => id in this.shops)
                case 'house':
                    return computed(() => id in this.houses)
            }
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

            this.$reset()
            this.playerInfo.friendCode = friendCode
            this.playerInfo.joinDate = saveData.player_info.join_date
            this.playerInfo.totalPlaytime = saveData.player_info.total_playtime
            this.playerInfo.currency.gems = saveData.player_info.currency.gems
            this.playerInfo.currency.bits = saveData.player_info.currency.bits

            let ponies = Array.isArray(saveData.inventory.ponies) ? saveData.inventory.ponies : Object.values(saveData.inventory.ponies)

            const poniesState = {}
            
            for (let pony of ponies) {
                const ponyInfo = await getObject(pony.id, 'pony')
                
                if (
                    ponyInfo.tags.includes('npc') ||
                    ponyInfo.tags.includes('quest') ||
                    (ponyInfo.group.length && !ponyInfo.group_master)
                ) {
                    continue
                }

                await this.addPony(ponyInfo, {
                    level: pony.level,
                }, poniesState)
            }

            this.ponies = poniesState

            const shopsState = {}

            for (let shop of saveData.inventory.shops) {
                try {
                    await this.addShop(shop, {}, shopsState)
                } catch (error) {
                    console.error(error)
                }
            }
            this.shops = shopsState
            
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
            pick: ['notes'],
            key: 'notes',
        },
    ],
})

import api from "@/scripts/api"
import gameData from "@/scripts/gameData"
import type { TDateISO } from "@/types/date"
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import { defineStore } from "pinia"
import { computed, reactive, ref } from "vue"

interface GenericInventoryEntry {
    id: string,
}

interface PonyInventoryEntry extends GenericInventoryEntry {
    level: 0 | 1 | 2 | 3 | 4 | 5,
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
        houses: (state) => {
            const houses: Set<GameObjectId> = new Set()
            for (let ponyId of Object.keys(state.ponies)) {
                const pony = gameData.getObject(ponyId, 'pony')
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
            return (id: GameObjectId) => id in this.houses
        },
    },
    actions: {
        addPony(id: GameObjectId | GameObject, info: Partial<Omit<PonyInventoryEntry, 'id'>> = {}) {
            const pony = gameData.getObject(id, 'pony')
            if (pony === null) {
                throw TypeError(`Invalid pony id: ${id}`)
            }

            const ponyInfo: PonyInventoryEntry = {
                id: pony.id,
                level: pony.max_level ? 5 : info.level || 0,
                minigame: info.minigame || '',
            }

            if (pony.changeling.id) {
                const changelingPony = gameData.getObject(pony.changeling.id, 'pony')
                if (changelingPony.max_level) {
                    ponyInfo.level = 5
                }

                if (changelingPony.id in this.ponies) {
                    this.ponies[changelingPony.id] = {
                        ...ponyInfo,
                        id: changelingPony.id,
                    }
                }
            }

            if (pony.group.length) {
                for (let friend of pony.group) {
                    this.ponies[friend] = {
                        ...ponyInfo,
                        id: friend,
                    }
                }
            }

            this.ponies[pony.id] = ponyInfo
        },
        addShop(id: GameObjectId, info: Partial<Omit<ShopInventoryEntry, 'id'>> = {}) {
            const shop = gameData.getObject(id, 'shop')
            if (shop === null) {
                throw TypeError(`Invalid shop id: ${id}`)
            }

            const shopInfo: ShopInventoryEntry = {
                id: id,
                timeReduction: info.timeReduction || 0,
                bitsBoost: info.bitsBoost || 0,
            }

            this.shops[id] = shopInfo
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
                const pony = gameData.getObject(id, 'pony')
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

        ownedRef(id: GameObjectId) {
            const gameObject = gameData.getObject(id)
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
            const saveData = await api.getSave(friendCode)

            if ('detail' in saveData) {
                throw Error(saveData.detail)
            }

            this.$reset()
            this.playerInfo.friendCode = friendCode
            this.playerInfo.joinDate = saveData.player_info.join_date
            this.playerInfo.totalPlaytime = saveData.player_info.total_playtime
            this.playerInfo.currency.gems = saveData.player_info.currency.gems
            this.playerInfo.currency.bits = saveData.player_info.currency.bits

            for (let pony of saveData.inventory.ponies) {
                const ponyInfo = gameData.getObject(pony.id, 'pony')
                
                if (ponyInfo.tags.includes('npc') || ponyInfo.tags.includes('quest')) {
                    continue
                }

                this.addPony(ponyInfo, {
                    level: pony.level,
                })
            }

            for (let shop of saveData.inventory.shops) {
                try {
                    this.addShop(shop)
                } catch (error) {
                    console.error(error)
                }
            }
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

import api, { type ShopEntry } from "@/scripts/api";
import gameData from "@/scripts/gameData";
import type { GameObject, GameObjectId } from "@/types/gameDataTypes";
import { defineStore } from "pinia";
import { shallowRef } from "vue";

enum ShopStatus {
    unloaded,
    pending,
    loaded,
    error,
}


class ShopStore {
    _shop: Record<string, ShopEntry> | null = null
    _status: ShopStatus = ShopStatus.unloaded
    _pending_result: Promise<Record<string, ShopEntry> | null> | null = null
    
    get isReady() {
        return this._status === ShopStatus.loaded
    }

    async getShop (): Promise<Record<string, ShopEntry>> {
        if (this._status === ShopStatus.loaded) {
            return this._shop
        }

        if (this._status === ShopStatus.pending) {
            await this._pending_result
            return this._shop
        }

        this._status = ShopStatus.pending

        this._pending_result = new Promise(async (resolve, reject) => {
            let shop = await api.getShop()

            console.log('checking')

            if (Array.isArray(shop)) {
                console.log('shop is Array')
                let shopData = {}
                this._shop = {}
                console.log('shop length', shop.length)
                console.log('shop', this._shop)
                for (let item of shop) {
                    // console.log('item loaded')
                    shopData[item.id] = item
                }
                this._shop = shopData
                this._status = ShopStatus.loaded
                console.log('finished loading shop')
                resolve(this._shop)
            } else {
                this._status = ShopStatus.error
                console.log('error when loading shop')
                reject(shop.detail)
            }
        })

        return await this._pending_result
    }

    get shop() {
        return this.getShop()
    }

    async getShopInfo(id: GameObjectId | GameObject) {
        const gameObject = gameData.getObject(id)
        let token = null
        let entry: ShopEntry | null = null
        if (gameObject.id in await this.shop) {
            entry = (await this.shop)[gameObject.id]
            if (entry?.in_shop) {
                if (entry?.tags.includes('pvsar1')) {
                    token = 'Token_Event_Rare'
                } else if (entry?.tags.includes('pvsar2')) {
                    token = 'Token_Event_Common'
                }
            }
        }

        const result = {
            id: gameObject.id,
            inShop: entry?.in_shop || false,
            hidden: entry?.hidden || false,
            tags: entry?.tags || [],
            token: gameObject.price?.token || token || null,
            price: {
                base: {
                    currency: entry?.price?.base?.currency || gameObject?.price?.base?.currency || null,
                    price: entry?.price?.base?.price || gameObject?.price?.base?.amount || null,
                    tokens: entry?.price?.base?.tokens || null,
                },
                sale: {
                    currency: entry?.price?.sale?.currency || gameObject?.price?.base?.currency || null,
                    price: entry?.price?.sale?.price || null,
                    tokens: entry?.price?.sale?.tokens || null,
                },
                royal: {
                    currency: entry?.price?.royal?.currency || gameObject?.price?.base?.currency || null,
                    price: entry?.price?.royal?.price || null,
                    tokens: entry?.price?.royal?.tokens || null,
                },
            },
        }

        return result
    }
}

export const shopStore = new ShopStore()

export const useShopStore = defineStore('shop', {
    state: () => {
        return {
            _shop: shallowRef(null as Record<string, ShopEntry> | null),
            _status: ShopStatus.unloaded as ShopStatus,
            _pending_result: null as Promise<any> | null,
        }
    },
    getters: {
        isReady: (state): boolean => state._status === ShopStatus.loaded,
        shop: async (state): Promise<Record<string, ShopEntry>> => {
            if (state._status === ShopStatus.loaded) {
                return state._shop
            }

            if (state._status === ShopStatus.pending) {
                await state._pending_result
                return state._shop
            }

            state._status = ShopStatus.pending

            state._pending_result = new Promise(async (resolve, reject) => {
                let shop = await api.getShop()

                console.log('checking')

                if (Array.isArray(shop)) {
                    console.log('shop is Array')
                    let shopData = {}
                    state._shop = {}
                    console.log('shop length', shop.length)
                    console.log('shop', state._shop)
                    for (let item of shop) {
                        // console.log('item loaded')
                        shopData[item.id] = item
                    }
                    state._shop = shopData
                    state._status = ShopStatus.loaded
                    console.log('finished loading shop')
                    resolve(state._shop)
                } else {
                    state._status = ShopStatus.error
                    console.log('error when loading shop')
                    reject(shop.detail)
                }
            })

            return await state._pending_result
        }
    },
    actions: {
        loadShop: async (state) => {
            if (state._status === ShopStatus.loaded) {
                return state._shop
            }

            if (state._status === ShopStatus.pending) {
                await state._pending_result
                return state._shop
            }

            state._status = ShopStatus.pending

            state._pending_result = new Promise(async (resolve, reject) => {
                let shop = await api.getShop()

                console.log('checking')

                if (Array.isArray(shop)) {
                    console.log('shop is Array')
                    let shopData = {}
                    state._shop = {}
                    console.log('shop length', shop.length)
                    console.log('shop', state._shop)
                    for (let item of shop) {
                        // console.log('item loaded')
                        shopData[item.id] = item
                    }
                    state._shop = shopData
                    state._status = ShopStatus.loaded
                    console.log('finished loading shop')
                    resolve(state._shop)
                } else {
                    state._status = ShopStatus.error
                    console.log('error when loading shop')
                    reject(shop.detail)
                }
            })

            return await state._pending_result
        },
        async getShopInfo(id: GameObjectId | GameObject) {
            const gameObject = gameData.getObject(id)
            let token = null
            let entry: ShopEntry | null = null
            if (gameObject.id in await this.shop) {
                entry = (await this.shop)[gameObject.id]
                if (entry?.in_shop) {
                    if (entry?.tags.includes('pvsar1')) {
                        token = 'Token_Event_Rare'
                    } else if (entry?.tags.includes('pvsar2')) {
                        token = 'Token_Event_Common'
                    }
                }
            }

            const result = {
                id: gameObject.id,
                inShop: entry?.in_shop || false,
                hidden: entry?.hidden || false,
                tags: entry?.tags || [],
                token: gameObject.price?.token || token || null,
                price: {
                    base: {
                        currency: entry?.price?.base?.currency || gameObject?.price?.base?.currency || null,
                        price: entry?.price?.base?.price || gameObject?.price?.base?.amount || null,
                        tokens: entry?.price?.base?.tokens || null,
                    },
                    sale: {
                        currency: entry?.price?.sale?.currency || gameObject?.price?.base?.currency || null,
                        price: entry?.price?.sale?.price || null,
                        tokens: entry?.price?.sale?.tokens || null,
                    },
                    royal: {
                        currency: entry?.price?.royal?.currency || gameObject?.price?.base?.currency || null,
                        price: entry?.price?.royal?.price || null,
                        tokens: entry?.price?.royal?.tokens || null,
                    },
                },
            }

            return result
        }
    },
})

import { findGap } from "@/scripts/common";
import type { TDateISO } from "@/types/date";
import type { GameObjectId } from "@/types/gameDataTypes";
import { defineStore } from "pinia";

interface WishlistItem {
    item: GameObjectId,
    dateAdded: string,
}

export interface Wishlist {
    id: number,
    name: string,
    image: {
        item: GameObjectId,
        image: string,
    },
    dateCreated: string,
    items: WishlistItem[],
}

export const useListStore = defineStore('lists', {
    state: () => {
        return {
            lists: new Map<number, Wishlist>(),
        }
    },
    actions: {
        createList(name: string, image: Wishlist['image'], date: Date) {
            const ids = [...this.lists.keys()].sort((a, b) => a - b)
            let id: number = findGap(ids, 1)


            if (this.lists.has(id)) {
                throw new Error(`id ${id} already in use`)
            }

            const list: Wishlist = {
                id,
                name,
                image: {
                    item: image.item,
                    image: image.image,
                },
                dateCreated: date.toISOString(),
                items: [],
            }
            this.lists.set(id, list)

            return list
        },
        getList(listId: number) {
            const list = this.lists.get(listId)
            if (!list) {
                throw new Error(`List with index ${listId} does not exist`)
            }
            return list
        },
        addItem(listId: number, objectId: GameObjectId) {
            const list = this.getList(listId)

            const today = new Date()
            
            let item = list.items.find(item => item.item === objectId)
            if (!item) {
                item = {
                    item: objectId,
                    dateAdded: today.toISOString(),
                }
                list.items.push(item)
            } else {
                // item.dateAdded = today.toISOString()
            }
        },
        removeItem(listId: number, objectId: GameObjectId) {
            const list = this.getList(listId)

            for (let i = 0; i < list.items.length; i++) {
                if (list.items[i].item === objectId) {
                    list.items.splice(i, 1)
                    break
                }
            }
        },
        listHasItem(listId: number, objectId: GameObjectId) {
            const list = this.getList(listId)
            return list.items.find(item => item.item === objectId) != undefined
        },
    },
    persist: {
        serializer: {
            serialize: (data) => {
                const newData = {
                    ...data,
                    lists: [...data.lists.values()],
                }

                return JSON.stringify(newData)
            },
            deserialize: (data) => {
                const newData = JSON.parse(data)
                
                newData.lists = (newData.lists as Wishlist[]).reduce((acc: Map<number, Wishlist>, current) => {
                    acc.set(current.id, current)
                    return acc
                }, new Map<number, Wishlist>())

                return newData
            }
        },
    },
})

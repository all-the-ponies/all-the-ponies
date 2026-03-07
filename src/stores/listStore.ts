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
            let id: number
            let previous: number = 1
            const ids = [...this.lists.keys()].sort()
            for (let key of ids) {
                if (previous) {
                    if (key - previous > 1) {
                        id = previous + 1
                        break
                    }
                }
                previous = key
            }
            if (!id) {
                id = ids.at(-1) + 1 || 1
            }

            console.log('new id', id)

            const list = {
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
    },
    persist: {
        serializer: {
            serialize: (data) => {
                console.log('data', data)
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

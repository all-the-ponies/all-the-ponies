import type { TDateISO } from "@/types/date";
import type { GameObjectId } from "@/types/gameDataTypes";
import { defineStore } from "pinia";

interface ListItem {
    item: GameObjectId,
    dateAdded: string,
}

interface List {
    id: number,
    name: string,
    image: {
        item: GameObjectId,
        image: string,
    },
    dateCreated: string,
    items: ListItem[],
}

export const useListStore = defineStore('lists', {
    state: () => {
        return {
            lists: new Map<number, List>(),
        }
    },
    actions: {
        createList(name: string, image: List['image'], date: Date) {
            let id: number
            let previous: number
            for (let key of [...this.lists.keys()].sort()) {
                if (previous) {
                    if (key - previous > 1) {
                        id = previous + 1
                        break
                    }
                }
                previous = key
            }
            if (!id) {
                id = this.lists.size + 1
            }

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
                
                newData.lists = (newData.lists as List[]).reduce((acc: Map<number, List>, current) => {
                    acc.set(current.id, current)
                    return acc
                }, new Map<number, List>())

                return newData
            }
        },
    },
})

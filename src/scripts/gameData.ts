import ky, { HTTPError } from 'ky'
import { computed, ref, toValue, unref, watch, watchEffect, type MaybeRef } from 'vue'
import { language } from '../globals'
import type { CategoryName, CategoryType, FortuneShop, FortuneShopItem, GameObject, GameObjectId, GameObjects, GroupQuests, TaskEntry, TasksData } from '../types/gameDataTypes'
import { createAssetUrl } from './assets'
import { removeSymbols } from './common'
import { getPageContext } from 'vike/getPageContext'
import { computedAsync, isClient } from '@vueuse/core'
import { getGlobalContext } from 'vike'
import type { GlobalContext } from 'vike/types'


export interface GameVersion {
    game_version: string
    content_version: string
}

export interface GameData {
    gameVersions: GameVersion,
    gameObjects: GameObjects,
    groupQuests: GroupQuests,
    fortuneShop: FortuneShop,
    tasksData: TasksData,
}

let gameDataCache: GameData = null

export function getGameVersions(): GameVersion {
    if (!gameDataCache) {
        console.log('Game data not loaded')
    }
    return gameDataCache?.gameVersions
}
export function getGameObjects(): GameObjects {
    if (!gameDataCache) {
        console.log('Game data not loaded')
    }
    return gameDataCache?.gameObjects
}
export function getGroupQuests(): GroupQuests {
    if (!gameDataCache) {
        console.log('Game data not loaded')
    }
    return gameDataCache?.groupQuests
}
export function getFortuneShop(): FortuneShop {
    if (!gameDataCache) {
        console.log('Game data not loaded')
    }
    return gameDataCache?.fortuneShop
}
export function getTasksData(): TasksData {
    if (!gameDataCache) {
        console.log('Game data not loaded')
    }
    return gameDataCache?.tasksData
}


export function useGameVersions() {
    return computed(() => {
        return getGameVersions()
    })
}
export function useGameObjects(lazy: boolean = false) {
    return computed(() => {
        return getGameObjects()
    })
}
export function useGroupQuests() {
    return computedAsync(() => {
        return getGroupQuests()
    })
}
export function useFortuneShop() {
    return computed(() => {
        return getFortuneShop()
    })
}
export function useTasksData() {
    return computed(() => {
        return getTasksData()
    })
}


export let loading = true
export let loaded = false
export let error: string | null = null

let resolveReady: () => void
export const ready = new Promise<void>(resolve => { resolveReady = resolve })

export async function loadGameData() {
    if (!gameDataCache) {
        console.log('Loading game data')
        gameDataCache = await fetchGameData()
        console.log('Loaded game data')
    } else {
        console.log('Game data already loaded')
    }
}

export async function fetchGameData() {
    // if (loaded) {
    //     return
    // }


    async function fetchData<T>(key: string): Promise<T> {
        const isSitemap = typeof process !== 'undefined' && process.env.GENERATING_SITEMAP === 'true'
        if (!isSitemap && !isClient) {
            const cloudflareModule = 'cloudflare:workers'
            const { env } = await import(/* @vite-ignore */ cloudflareModule)
            const object = await env.GAME_ASSETS_BUCKET.get(key)
            if (!object) {
                throw new Error(`Could not find asset ${key}`)
            }
            return await object.json() as T
        } else {
            return await ky<T>(createAssetUrl(key)).json()
        }
    }
    
    loading = true
    error = null
    try {
        const [versions, objects, quests, fortune, tasks] = await Promise.all([
            fetchData<GameVersion>('game_version.json'),
            fetchData<GameObjects>('game_objects.json'),
            fetchData<GroupQuests>('group_quests.json'),
            fetchData<FortuneShop>('fortune_shop.json'),
            fetchData<TasksData>('tasks_data.json'),
        ])
        resolveReady()
        loaded = true

        return {
            gameVersions: versions,
            gameObjects: objects,
            groupQuests: quests,
            fortuneShop: fortune,
            tasksData: tasks,
        } as GameData
        
    } catch (e) {
        error = (e as Error).message
        console.error('Error loading game data', e)
        if (e instanceof HTTPError) {
            console.error(await e.response.text())
        }
        throw e
    } finally {
        loading = false
    }
}

export function getObject<T extends CategoryName>(
    id: GameObjectId | GameObject,
    category: T = null,
): CategoryType<T> | null {
    const objs = getGameObjects()
    if (!objs) return null
    if (id instanceof Object && id.constructor === Object) {
        return id as CategoryType<T>
    }
    if (category === null) {
         for (const c of (Object.keys(objs) as (CategoryName | 'file_version')[])) {
            if (c === 'file_version') continue
            
            let object = getObject(id, c)
            if (object != null) {
                return object as CategoryType<T>
            }
        }
        return null
    } else if (typeof id === 'string') {
        if (!objs[category as CategoryName]?.objects[id]) {
            if (category === 'item') {
                for (const item of Object.values(objs['item'].objects)) {
                    if (item.alt_ids.includes(id)) {
                        return item as CategoryType<T>
                    }
                }
            }
            return null
        }
        return objs[category as CategoryName]?.objects[id] as CategoryType<T>
    }
    return null
}

export function getFortuneShopData(id: GameObjectId): FortuneShopItem | null {
    const fs = getFortuneShop()
    if (!fs) return null
    for (let items of Object.values(fs.items)) {
        let item = items[id]
        if (item) {
            return item
        }
    }
    return null
}

export function getTaskInfo(taskId: string | TaskEntry) {
    if (typeof taskId !== 'string') {
        return taskId
    }
    return (getTasksData()).tasks[taskId] ?? null
}

export function translateName(gameObject: MaybeRef<GameObject>) {
    return computed(() => {
      const obj = toValue(gameObject)
      
      if (!obj || obj.category === 'costume_part') {
        return null
      }
      if (obj.preferred_name && obj.preferred_name[language.value.key]) {
        return obj.preferred_name[language.value.key]
      } else {
        return obj.name[language.value.key]
      }
  })
}

export function useObjectName(id: GameObjectId | GameObject, category: CategoryName) {
    // return ref(id)
    
    // const name = ref<string>(null)

    // const getName = () => {
        // name.value = id
        // getObject(id, category)
        //     .then(gameObject => name.value = translateName(gameObject).value)
        // const gameObject = 
        // console.log('found object')
        // console.log('gameObject', gameObject)
        // name.value = translateName(gameObject)
    // }

    // watch(
    //     computed(() => [id, category]),
    //     (newValue, oldValue) => {
    //         if (newValue != oldValue) {
    //             getName()
    //         }
    //     }
    // )

    //  getName()

    // watchEffect(() => {
    //     getName()
    // })
    
    // return {name}

    // return computedAsync(
    //     async () => {
    //         console.log('getting object')
    //         const gameObject = await getObject(id, category)
    //         console.log('found object')
    //         console.log('gameObject', gameObject)
    //         return translateName(gameObject)
    //     },
    //     null,
    //     {lazy: true, shallow: false},
    // )
}

export function getNames(gameObject: GameObject) {
    if (gameObject.category === 'costume_part') return null
    let names = [gameObject.name[language.value.key]]
    if (gameObject.preferred_name && gameObject.preferred_name[language.value.key]) {
        names.push(gameObject.preferred_name[language.value.key])
    }
    if (gameObject.alt_name && gameObject.alt_name[language.value.key]) {
        names.push(...gameObject.alt_name[language.value.key])
    }
    return names
}

export function getNamesForSearch(gameObject: GameObject) {
    return getNames(gameObject).map(name => removeSymbols(name))
}


export function useGameObject<T extends CategoryName>(
    id: MaybeRef<GameObjectId | GameObject>,
    category: MaybeRef<T> = null,
) {
    return computed(
        () => {
            const result = getObject(unref(id), unref(category))
            return result
        },
    )
}

export default {
    get loading() { return loading },
    get error() { return error },
    get ready() { return ready },
    loadGameData: fetchGameData,
    getObject,
    translateName,
    getNames,
    getNamesForSearch,
    getFortuneShopData,
}

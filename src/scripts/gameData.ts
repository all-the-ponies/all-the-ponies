import ky, { HTTPError } from 'ky'
import { computed, ref, toValue, unref, watch, watchEffect, type MaybeRef } from 'vue'
import { language } from '../globals'
import type { CategoryName, CategoryType, FortuneShop, FortuneShopItem, GameObject, GameObjectId, GameObjects, GroupQuests } from '../types/gameDataTypes'
import { createAssetUrl } from './assets'
import { removeSymbols } from './common'
import { getPageContext } from 'vike/getPageContext'
import { computedAsync } from '@vueuse/core'
import { getGlobalContext } from 'vike'
import type { GlobalContext } from 'vike/types'


interface GameVersion {
    game_version: string
    content_version: string
}

export interface GameData {
    gameVersions: GameVersion,
    gameObjects: GameObjects,
    groupQuests: GroupQuests,
    fortuneShop: FortuneShop,
}

export async function getGameVersions(): Promise<GameVersion> {
    const globalContext = await getGlobalContext() as GlobalContext & {gameData: GameData}
    return globalContext.gameData?.gameVersions
}
export async function getGameObjects(): Promise<GameObjects> {
    const globalContext = await getGlobalContext() as GlobalContext & {gameData: GameData}
    return globalContext.gameData?.gameObjects
}
export async function getGroupQuests(): Promise<GroupQuests> {
    const globalContext = await getGlobalContext() as GlobalContext & {gameData: GameData}
    return globalContext.gameData?.groupQuests
}
export async function getFortuneShop(): Promise<FortuneShop> {
    const globalContext = await getGlobalContext() as GlobalContext & {gameData: GameData}
    return globalContext.gameData?.fortuneShop
}


export function useGameVersions() {
    return computedAsync(async () => {
        return await getGameVersions()
    }, null, {lazy: true})
}
export function useGameObjects() {
    return computedAsync(async () => {
        return await getGameObjects()
    }, null, {lazy: true})
}
export function useGroupQuests() {
    return computedAsync(async () => {
        return await getGroupQuests()
    }, null, {lazy: false})
}
export function useFortuneShop() {
    return computedAsync(async () => {
        return await getFortuneShop()
    }, null, {lazy: true})
}





export let loading = true
export let loaded = false
export let error: string | null = null

let resolveReady: () => void
export const ready = new Promise<void>(resolve => { resolveReady = resolve })

export async function loadGameData() {
    // if (loaded) {
    //     return
    // }
    
    loading = true
    error = null
    try {
        const [versions, objects, quests, fortune] = await Promise.all([
            ky<GameVersion>(createAssetUrl('game_version.json')).json(),
            ky<GameObjects>(createAssetUrl('game_objects.json')).json(),
            ky<GroupQuests>(createAssetUrl('group_quests.json')).json(),
            ky<FortuneShop>(createAssetUrl('fortune_shop.json')).json(),
        ])
        resolveReady()
        loaded = true

        return {
            gameVersions: versions,
            gameObjects: objects,
            groupQuests: quests,
            fortuneShop: fortune,
        } as GameData
        
    } catch (e) {
        error = (e as Error).message
        if (e instanceof HTTPError) {
            console.error(await e.response.text())
        }
        throw e
    } finally {
        loading = false
    }
}

export async function getObject<T extends CategoryName>(
    id: GameObjectId | GameObject,
    category: T = null,
): Promise<CategoryType<T> | null> {
    const objs = await getGameObjects()
    if (!objs) return null
    if (id instanceof Object && id.constructor === Object) {
        return id as CategoryType<T>
    }
    if (category === null) {
         for (const c of (Object.keys(objs) as (CategoryName | 'file_version')[])) {
            if (c === 'file_version') continue
            
            let object = await getObject(id, c)
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

export async function getFortuneShopData(id: GameObjectId): Promise<FortuneShopItem | null> {
    const fs = await getFortuneShop()
    if (!fs) return null
    for (let items of Object.values(fs.items)) {
        let item = items[id]
        if (item) {
            return item
        }
    }
    return null
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
    
    const name = ref<string>(null)

    const getName = () => {
        // name.value = id
        // getObject(id, category)
        new Promise((resolve) => {
            setTimeout(() => {resolve(0)}, 1000)
        })
            .then(() => name.value = id)
        //     .then(gameObject => name.value = translateName(gameObject))
        // const gameObject = 
        // console.log('found object')
        // console.log('gameObject', gameObject)
        // name.value = translateName(gameObject)
    }

    // watch(
    //     computed(() => [id, category]),
    //     (newValue, oldValue) => {
    //         if (newValue != oldValue) {
    //             getName()
    //         }
    //     }
    // )

     getName()

    // watchEffect(() => {
    //     getName()
    // })
    
    return {name}

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
    return computedAsync(
        async () => {
            const result = await getObject(unref(id), unref(category))
            return result
        },
        null,
        // {lazy: true},
    )
}

export default {
    get loading() { return loading },
    get error() { return error },
    get ready() { return ready },
    loadGameData,
    getObject,
    translateName,
    getNames,
    getNamesForSearch,
    getFortuneShopData,
}

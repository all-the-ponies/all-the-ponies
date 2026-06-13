import ky from 'ky'
import { computed } from 'vue'
import { language } from '../globals'
import type { CategoryName, CategoryType, FortuneShop, FortuneShopItem, GameObject, GameObjectId, GameObjects, GroupQuests, Language } from '../types/gameDataTypes'
import { createAssetUrl } from './assets'
import { fixName, removeSymbols, transformName } from './common'


interface GameVersion {
    game_version: string
    content_version: string
}

export let gameVersions: GameVersion | null = null
export let gameObjects: GameObjects | null = null
export let groupQuests: GroupQuests | null = null
export let fortuneShop: FortuneShop | null = null

export let loading = true
export let error: string | null = null

let resolveReady: () => void
export const ready = new Promise<void>(resolve => { resolveReady = resolve })

export async function loadGameData(): Promise<void> {
    loading = true
    error = null
    try {
        const [versions, objects, quests, fortune] = await Promise.all([
            ky<GameVersion>(createAssetUrl('game_version.json')).json(),
            ky<GameObjects>(createAssetUrl('game_objects.json')).json(),
            ky<GroupQuests>(createAssetUrl('group_quests.json')).json(),
            ky<FortuneShop>(createAssetUrl('fortune_shop.json')).json(),
        ])
        gameVersions = versions
        gameObjects = objects
        groupQuests = quests
        fortuneShop = fortune
        resolveReady()
    } catch (e) {
        error = (e as Error).message
        throw e
    } finally {
        loading = false
    }
}

export function getObject<T extends CategoryName>(
    id: GameObjectId | GameObject,
    category: T = null,
    usedName: string | null = null,
): CategoryType<T> | null {
    if (!gameObjects) return null
    if (id instanceof Object && id.constructor === Object) {
        return id as CategoryType<T>
    }
    if (category === null) {
         for (const c of (Object.keys(gameObjects) as (CategoryName | 'file_version')[])) {
            if (c === 'file_version') continue
            
            let object = getObject(id, c)
            if (object != null) {
                return object as CategoryType<T>
            }
        }
        return null
    } else if (typeof id === 'string') {
        if (!gameObjects[category as CategoryName]?.objects[id]) {
            if (category === 'item') {
                for (const item of Object.values(gameObjects['item'].objects)) {
                    if (item.alt_ids.includes(id)) {
                        return item as CategoryType<T>
                    }
                }
            }
            return null
        }
        return gameObjects[category as CategoryName]?.objects[id] as CategoryType<T>
    }
    return null
}

export function getFortuneShopData(id: GameObjectId): FortuneShopItem | null {
    if (!fortuneShop) return null
    for (let items of Object.values(fortuneShop.items)) {
        let item = items[id]
        if (item) {
            return item
        }
    }
    return null
}

export function translateName(gameObject: GameObject) {
  return computed(() => {
    if (!gameObject || gameObject.category === 'costume_part') {
      return null
    }
    if (gameObject.preferred_name && gameObject.preferred_name[language.value.key]) {
      return gameObject.preferred_name[language.value.key]
    } else {
      return gameObject.name[language.value.key]
    }
  })
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

export default {
    get gameVersions() { return gameVersions },
    get gameObjects() { return gameObjects },
    get groupQuests() { return groupQuests },
    get fortuneShop() { return fortuneShop },
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

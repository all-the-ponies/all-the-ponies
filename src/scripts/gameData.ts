import { transformName, fixName } from './common'
import { type CategoryName, type CategoryType, type GAME_DATA_Type, type GameObject, type GameObjectId, type Language } from '../types/gameDataTypes'
import GAME_DATA from '@/assets/game-data/game-data.json'
import { computed } from 'vue'
import { language } from '@/globals'

const gameVersion = GAME_DATA.game_version
const contentVersion = GAME_DATA.content_version

// for (let [categoryName, category] of Object.entries(GAME_DATA.categories)) {
//     for (let [id, object] of Object.entries(category.objects)) {
//         object.id = id
//         object.category = categoryName
//     }
// }

function getObject<T extends CategoryName>(
    id: GameObjectId | GameObject,
    category: T = null,
    usedName: string | null = null,
): CategoryType<T> | null {
    if (id instanceof Object && id.constructor === Object) {
        return id as CategoryType<T>
    }
    if (category === null) {
        for (const c of (Object.keys(GAME_DATA.categories) as CategoryName[])) {
            let object = getObject(id, c)
            if (object != null) {
                return object as CategoryType<T>
            }
        }
        return null
    } else if (typeof id === 'string') {
        if (!GAME_DATA.categories[category as CategoryName]?.objects[id]) {
            if (category as CategoryName === 'item') {
                for (const item of Object.values(GAME_DATA.categories[category as 'item'].objects)) {
                    if (item.alt_ids.includes(id)) {
                        return item as CategoryType<T>
                    }
                }
            }
            return null
        }
        return GAME_DATA.categories[category as CategoryName]?.objects[id]
    }
    return null
}

function searchName(
    name: string,
    category: CategoryName | string[] | GameObject[] = 'pony',
    language: Language = 'english',
):  GameObject[] {
    let objects: GameObject[] = []
    
    if (typeof category == 'string') {
        if (!(category in GAME_DATA.categories)) {
            throw RangeError(`Category ${category} does not exist`)
        }
        objects = Object.values(GAME_DATA.categories[category].objects)
    } else if (Array.isArray(category)) {
        for (let gameObject of category) {
            if (gameObject instanceof Object && gameObject.constructor === Object) {
                objects.push(gameObject)
            } else if (typeof gameObject == 'string') {
                objects.push(getObject(gameObject))
            }
        }
        // objects = category.map((id) => getObject(id))
    }
    
    const originalName = name
    name = transformName(name)
    if (name == '') {
        return Object.values(objects)
    }
    let result: GameObject[] = []

    function addResult(object: GameObject) {
        if (!result.includes(object)) {
            result.push(object)
        }
    }

    for (let item of Object.values(objects)) {
        if (transformName(fixName(item.name[language])).includes(name)) {
            addResult(item)
        } else if (
            item.alt_name && item.alt_name[language] &&
            item.alt_name[language].some((searchName) => transformName(fixName(searchName)).includes(name))
        ) {
            addResult(item)
        } else if (
          item.preferred_name && item.preferred_name[language] &&
          transformName(fixName(item.preferred_name[language])).includes(name)
        ) {
            addResult(item)
        } else if (item.id === originalName) {
            addResult(item)
        }
    }
    return result
}

function translateName(gameObject: GameObject) {
  return computed(() => {
    if (gameObject === null) {
      return null
    }
    if (gameObject.preferred_name && gameObject.preferred_name[language.value.key]) {
      return gameObject.preferred_name[language.value.key]
    } else {
      return gameObject.name[language.value.key]
    }
  })
}

export default {
    gameVersion,
    contentVersion,
    data: GAME_DATA,
    getObject,
    searchName,
    translateName,
}

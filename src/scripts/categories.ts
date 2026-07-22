import { language } from "@/globals"
import { useSaveStore } from "@/stores/saveManager"
import type { Ref } from "vue"
import type { CategoryName, DecorType, GameObject, Location, PonyType, ShopType, CostumeType, TranslatableString, HouseType } from "../types/gameDataTypes"
import { getObject, useGroupQuests, translateName, getTaskInfo } from "./gameData"
import type { FilterFunctionType, SortFunctionType } from "@/types/searchTypes"

const groupQuests = useGroupQuests()

let saveManager: ReturnType<typeof useSaveStore>

function getSaveManager() {
  if (!saveManager) {
    saveManager = useSaveStore()
  }
  return saveManager
}

export const CATEGORIES: Partial<Record<CategoryName, {
  string: string,
  plural?: string,
}>> = {
    pony: {
        string: 'game_object.pony.pony',
        plural: 'ponies',
    },
    house: {
        string: 'game_object.house.house',
        plural: 'houses',
    },
    shop: {
        string: 'game_object.shop.shop',
        plural: 'shops',
    },
    decor: {
        string: 'game_object.decor.decor',
        plural: 'decor',
    },
    token: {
        string: 'game_object.token.token',
        plural: 'tokens',
    },
    avatar: {
        string: 'game_object.profile_decorations.avatar.avatar',
        plural: 'avatars',
    },
    avatar_frame: {
      string: 'game_object.profile_decorations.avatar_frame.avatar_frame',
      plural: 'avatar_frames',
    },
    background: {
        string: 'game_object.profile_decorations.background.background',
        plural: 'backgrounds',
    },
    background_frame: {
        string: 'game_object.profile_decorations.background_frame.background_frame',
        plural: 'background_frames',
    },
    cutie_mark: {
        string: 'game_object.profile_decorations.cutie_mark.cutie_mark',
        plural: 'cutie_marks',
    },
    pet: {
        string: 'game_object.pet.pet',
        plural: 'pets',
    },
    costume: {
      string: 'game_object.costume.costume',
      plural: 'costumes'
    },
}

export const PLURAL_CATEGORY_MAP: Record<string, CategoryName> = {
    ponies: 'pony',
    houses: 'house',
    shops: 'shop',
    decor: 'decor',
    avatars: 'avatar',
    avatar_frames: 'avatar_frame',
    backgrounds: 'background',
    background_frames: 'background_frame',
    cutie_marks: 'cutie_mark',
    pets: 'pet',
    costumes: 'costume',
    tokens: 'token',
}

export const SortFunctions: Partial<Record<'common' | CategoryName, {[keys: string]: SortFunctionType}>> = {
    common: {
        index: {
            name: 'sorting.game_order',
            check(a: {index: number}, b: {index: number}) {
                return a.index - b.index
            },
            default: true,
        },
        alphabetically: {
            name: 'sorting.alphabetically',
            check(
              a: {name: TranslatableString, preferred_name?: TranslatableString},
              b: {name: TranslatableString, preferred_name?: TranslatableString},
            ) {
                const name1 = translateName(a).value
                const name2 = translateName(b).value
                return new Intl.Collator(language.value.code).compare(name1, name2)
            }
        }
    },
    
    shop: {
      production: {
        name: 'sorting.shop.production',
        check(a: ShopType, b: ShopType) {
          const productA = getObject(a.product, 'consumable')
          const productB = getObject(b.product, 'consumable')

          if (!(productA && Object.keys(productA.consume).length) ||
              !(productB && Object.keys(productB.consume).length)) {
              if (productA && Object.keys(productA.consume).length) {
                return 1
              } else if (productB && Object.keys(productB.consume).length) {
                return -1
              }

              return 0
          }
          
          if (productA.consume.gems > 0 || productB.consume.gems > 0) {
            if (productA.consume.gems === 0) {
              return 1
            } else if (productB.consume.gems === 0) {
              return -1
            }
            
            return (productB.consume.gems / productB.time) - (productA.consume.gems / productA.time)
          } else if (productA.consume.bits > 0 || productB.consume.bits > 0) {
            if (productA.consume.bits === 0) {
              return 1
            } else if (productB.consume.bits === 0) {
              return -1
            }
            
            return (productB.consume.bits / productB.time) - (productA.consume.bits / productA.time)
          } else if (productA.consume.tls > 0 || productB.consume.tls > 0) {
            if (productA.consume.tls === 0) {
              return 1
            } else if (productB.consume.tls === 0) {
              return -1
            }
            
            return (productB.consume.tls / productB.time) - (productA.consume.tls / productA.time)
          }
        }
      },
      xp: {
        name: 'sorting.shop.xp_rate',
        check(a: ShopType, b: ShopType) {
          const productA = getObject(a.product, 'consumable')
          const productB = getObject(b.product, 'consumable')

          if (!(productA && Object.keys(productA.consume).length) ||
              !(productB && Object.keys(productB.consume).length)) {
              if (productA && Object.keys(productA.consume).length) {
                return 1
              } else if (productB && Object.keys(productB.consume).length) {
                return -1
              }

              return 0
          }

          return (productB.consume.xp / productB.time) - (productA.consume.xp / productA.time)
        }
      }
    },

    decor: {
        fusion: {
            name: "game_object.decor.fusion_points",
            check(a: DecorType, b: DecorType) {
                return a.fusion_points - b.fusion_points
            },
        },
        pro_rate: {
          name: "sorting.decor.pro_rate",
          check(a: DecorType, b: DecorType) {
            if (!a.pro.is_pro || !b.pro.is_pro) {
              if (a.pro.is_pro) {
                return -1
              } else if (b.pro.is_pro) {
                return 1
              }
              return 0
            }

            return (b.pro.bits || b.pro.time) - (a.pro.bits || a.pro.time)
          }
        }
    }
}


export const FilterFunctions: Partial<Record<'common' | CategoryName, {[keys: string]: FilterFunctionType<GameObject>}>> = {
    pony: {
        playable: {
            name: "filter.pony.playable",
            check(gameObject: PonyType) {
              return (gameObject.group.length == 0 || gameObject.group?.length && gameObject.group_master)},
            default: true,
            exclude: ['npc', 'unused', 'quest'],
        },
        pro: {
            name: 'filter.pony.pro',
            check(gameObject: PonyType) {
              if (!groupQuests.value) {
                return false
              }
              
              let showPro = false

              if (!gameObject.pro) {
                console.log(gameObject.id, gameObject.pro)
              }
              
              for (let quest of gameObject.pro) {
                if (quest === 'random') {
                  showPro = true
                  break
                }
                if (!groupQuests.value.quests[quest].special) {
                  showPro = true
                  break
                }
              }
              return showPro
            },
            // default: true,
        },
        gem: {
          name: 'filter.pony.gem_pony',
          check(gameObject: PonyType) {
            const tasks = gameObject.tasks.map(task => getTaskInfo(task))
            return tasks.some(task => task?.reward.gems)
          }
        },
        npc: {
            name: "filter.pony.npc",
            check(gameObject: PonyType) {return gameObject.tags.includes('npc')},
        },
        unused: {
            name: "filter.pony.unused",
            check(gameObject: PonyType) {return gameObject.tags.includes('unused')},
        },
        quest: {
            name: "filter.pony.quest",
            check(gameObject: PonyType) {return gameObject.tags.includes('quest')},
        },
        notOwned: {
          name: 'filter.pony.not_owned',
          check(gameObject: PonyType) {
            return !getSaveManager().hasPony(gameObject.id)
          },
          include: ['playable'],
          client: true,
        },
    },
    house: {
      unused: {
        name: "filter.pony.unused",
        check(house: HouseType) {
          return house.tags.includes('unused')
        }
      }
    },
    shop: {
      // base: {
      //   check(gameObject: ShopType) {
      //     return true
      //   },
      //   hidden: true,
      //   default: true,
      // },
      bits: {
        name: translateName(getObject('Bits', 'item')),
        check(gameObject: ShopType) {
          const product = getObject(gameObject.product, 'consumable')
          return product && product.consume.bits > 0
        },
        // default: true
      },
      gems: {
        name: 'filter.shop.gem_shop',
        check(gameObject: ShopType) {
          const product = getObject(gameObject.product, 'consumable')
          return product && product.consume.gems > 0
        },
        // default: true
      },
      maze: {
        name: 'filter.shop.maze',
        check(gameObject: ShopType) {
          const product = getObject(gameObject.product, 'consumable')
          return product && product.consume.tls > 0
        },
        // default: true
      },
      other: {
        name: 'filter.shop.others',
        check(gameObject: ShopType) {
          const product = getObject(gameObject.product, 'consumable')
          return !(product && (product.consume.bits || product.consume.gems || product.consume.tls))
        },
        // default: true,
      },
      notOwned: {
        name: 'filter.shop.not_owned',
        check(gameObject: ShopType) {
          return !getSaveManager().hasShop(gameObject.id)
        },
        exclude: ['maze'],
        client: true,
      },
    },
    decor: {
      regular: {
        name: 'filter.decor.regular',
        check(gameObject: DecorType) {
          return !gameObject.pro.is_pro
        },
        // default: true
      },
      pro: {
        name: 'game_object.decor.pro_decor',
        check(gameObject: DecorType) {
          return gameObject.pro.is_pro
        },
        // default: true
      },
      can_fuse: {
        name: 'filter.decor.can_fuse',
        check(gameObject: DecorType) {
          return !!gameObject.fusion_points
        },
        // default: true,
      },
      unused: {
          name: "filter.pony.unused",
          check(gameObject: DecorType) {return gameObject.tags?.includes('unused')},
      },
    },
    costume: {
      used: {
        name: 'filter.costume.used',
        exclude: ['unused'],
        default: true,
      },
      unused: {
          name: "filter.pony.unused",
          check(gameObject: CostumeType) {return gameObject.tags?.includes('unused')},
      },
    },
}

export const LOCATIONS: Record<Location, {string: string}> = {
  PONYVILLE: {
    string: 'location.ponyville',
  },
  SWEET_APPLE_ACRES: {
    string: 'location.sweet_apple_acres',
  },
  CANTERLOT: {
    string: 'location.canterlot',
  },
  CRYSTAL_EMPIRE: {
    string: 'location.crystal_empire',
  },
  KLUGETOWN: {
    string: 'location.klugetown',
  },
  EVERFREE_FOREST: {
    string: 'location.everfree_forest',
  },
  CHANGELING_KINGDOM: {
    string: 'location.changeling_kingdom',
  },
  UNKNOWN: {
    string: 'location.unknown',
  }
}

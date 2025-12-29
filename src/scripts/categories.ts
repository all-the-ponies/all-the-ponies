import { language } from "@/main"
import type { CategoryName, DecorType, GameObject, Location, PonyType, ShopType } from "../types/gameDataTypes"
import gameData from "./gameData"
import type { Ref } from "vue"
import { useSaveStore } from "@/stores/saveManager"

const saveManager = useSaveStore()

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
    frame: {
        string: 'game_object.profile_decorations.frame.frame',
    },
    background_frame: {
        string: 'game_object.profile_decorations.background_frame.background_frame',
    },
    background: {
        string: 'game_object.profile_decorations.background.background',
    },
}

export const PLURAL_CATEGORY_MAP = {
    ponies: 'pony',
    houses: 'house',
    shops: 'shop',
    decor: 'decor',
    avatars: 'avatar',
}

export interface SortFunctionsType {
    name: string | Ref,
    check(a: GameObject, b: GameObject): number,
    default?: boolean,
    category?: CategoryName,
}

export const SortFunctions: Partial<Record<'common' | CategoryName, {[keys: string]: SortFunctionsType}>> = {
    common: {
        index: {
            name: 'sorting.game_order',
            check(a, b) {
                return a.index - b.index
            },
            default: true,
        },
        alphabetically: {
            name: 'sorting.alphabetically',
            check(a, b) {
                const name1 = gameData.translateName(a).value
                const name2 = gameData.translateName(b).value
                return new Intl.Collator(language.value.code).compare(name1, name2)
                if (name1 < name2) return -1
                if (name1 > name2) return 1
                return 0
            }
        }
    },
    
    shop: {
      production: {
        name: 'sorting.shop.production',
        check(a: ShopType, b: ShopType) {
          if (!(a.product && Object.keys(a.product).length) ||
              !(b.product && Object.keys(b.product).length)) {
              if (a.product && Object.keys(a.product).length) {
                return 1
              } else if (b.product && Object.keys(b.product).length) {
                return -1
              }

              return 0
          }
          
          if (a.product.gems > 0 || b.product.gems > 0) {
            if (a.product.gems === 0) {
              return 1
            } else if (b.product.gems === 0) {
              return -1
            }
            
            return (b.product.gems / b.product.time) - (a.product.gems / a.product.time)
          } else if (a.product.bits > 0 || b.product.bits > 0) {
            if (a.product.bits === 0) {
              return 1
            } else if (b.product.bits === 0) {
              return -1
            }
            
            return (b.product.bits / b.product.time) - (a.product.bits / a.product.time)
          } else if (a.product.tls > 0 || b.product.tls > 0) {
            if (a.product.tls === 0) {
              return 1
            } else if (b.product.tls === 0) {
              return -1
            }
            
            return (b.product.tls / b.product.time) - (a.product.tls / a.product.time)
          }
        }
      },
      xp: {
        name: 'sorting.shop.xp_rate',
        check(a: ShopType, b: ShopType) {
          if (!(a.product && Object.keys(a.product).length) ||
              !(b.product && Object.keys(b.product).length)) {
              if (a.product && Object.keys(a.product).length) {
                return 1
              } else if (b.product && Object.keys(b.product).length) {
                return -1
              }

              return 0
          }

          return (b.product.xp / b.product.time) - (a.product.xp / a.product.time)
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

export interface FilterFunctionsType {
    name: string | Ref,
    // type: 'checkbox' | 'radio' | 'text' | 'number',
    check(gameObject: GameObject): boolean,
    default?: boolean,
    category?: CategoryName,
    group?: string,
}

export const FilterFunctions: Partial<Record<'common' | CategoryName, {[keys: string]: FilterFunctionsType}>> = {
    pony: {
        playable: {
            name: "filter.pony.playable",
            check(gameObject: PonyType) {return gameObject.tags.length === 0 && (gameObject.group.length == 0 || gameObject.group.length && gameObject.group_master)},
            default: true,
        },
        pro: {
            name: 'filter.pony.pro',
            check(gameObject: PonyType) {return gameObject.pro != null},
            default: true,
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
            return !saveManager.hasPony(gameObject.id)
          }
        },
    },
    shop: {
      bits: {
        name: gameData.translateName(gameData.getObject('Bits', 'item')),
        check(gameObject: ShopType) {
          return gameObject.product && gameObject.product.bits > 0
        },
        default: true
      },
      gems: {
        name: 'filter.shop.gem_shop',
        check(gameObject: ShopType) {
          return gameObject.product && gameObject.product.gems > 0
        },
        default: true
      },
      maze: {
        name: 'filter.shop.maze',
        check(gameObject: ShopType) {
          return gameObject.product && gameObject.product.tls > 0
        },
        default: true
      },
      other: {
        name: 'filter.shop.others',
        check(gameObject: ShopType) {
          return !(gameObject.product && (gameObject.product.bits || gameObject.product.gems || gameObject.product.tls))
        },
        default: true,
      },
      notOwned: {
        name: 'filter.shop.not_owned',
        check(gameObject: ShopType) {
          return !saveManager.hasShop(gameObject.id)
        }
      },
    },
    decor: {
      regular: {
        name: 'filter.decor.regular',
        check(gameObject: DecorType) {
          return !gameObject.pro.is_pro
        },
        default: true
      },
      pro: {
        name: 'game_object.decor.pro_decor',
        check(gameObject: DecorType) {
          return gameObject.pro.is_pro
        },
        default: true
      },
      can_fuse: {
        name: 'filter.decor.can_fuse',
        check(gameObject: DecorType) {
          return !!gameObject.fusion_points
        },
        default: true,
      },
      unused: {
          name: "filter.pony.unused",
          check(gameObject: DecorType) {return gameObject.tags?.includes('unused')},
      },
    }
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

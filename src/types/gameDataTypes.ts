export type GameObjectId = string

export type Language = 'arabic' |
                    'chinese' |
                    'english' |
                    'french' |
                    'german' |
                    'italian' |
                    'japanese' |
                    'korean' |
                    'brazilian portuguese' |
                    'russian' |
                    'spanish' |
                    'thai' |
                    'turkish'

export type Location = 'PONYVILLE' |
                'CANTERLOT' |
                'SWEET_APPLE_ACRES' |
                'EVERFREE_FOREST' |
                'CRYSTAL_EMPIRE' |
                'CHANGELING_KINGDOM' |
                'KLUGETOWN' |
                'UNKNOWN'

export type Currency = 'Gems' | 'Bits' | ''

export type CategoryName = 'pony' |
                    'house' |
                    'shop' |
                    'decor' |
                    'item' |
                    'token' |
                    'avatar' |
                    'frame' |
                    'background_frame' |
                    'background'

export type CategoryType<T> = 
    T extends 'pony' ? PonyType :
    T extends 'house' ? HouseType :
    T extends 'shop' ? ShopType :
    T extends 'decor' ? DecorType :
    T extends 'item' ? ItemType :
    T extends 'token' ? TokenType :
    T extends 'avatar' ? AvatarType :
    T extends null ? GenericObjectType :
    never

export type GameObject = PonyType |
                        HouseType |
                        ShopType |
                        DecorType |
                        ItemType |
                        TokenType |
                        AvatarType |
                        GenericObjectType

export interface GAME_DATA_Type {
    file_version: number,
    game_version: string,
    content_version: string,
    categories: {
        pony: {
            clones: object,
            objects: {[ key: string]: PonyType},
        },
        house: {objects: {[ keys: string ]: HouseType},},
        shop: {objects: {[ keys: string ]: ShopType},},
        decor: {objects: {[ keys: string ]: DecorType},},
        item: {objects: {[ keys: string ]: ItemType},},
        token: {objects: {[ keys: string ]: TokenType},},
        avatar: {objects: {[ keys: string ]: AvatarType},},
    },
    group_quests: GroupQuests,
}


type TranslatableString = Record<Language, string>
type AltName = Partial<Record<Language, string[]>> 

export interface StarReward {
    item: string,
    amount: number,
}

export interface Cost {
    base: {
        currency: Currency,
        amount: number,
    },
    actual: {
        currency: Currency,
        amount: number,
    },
    token: {
        id: string,
        amount: number
    },
    daily_goals: number
}

interface GenericObjectType {
    locked?: boolean,
    index: number,
    category: CategoryName,
    id: string,
    name: TranslatableString,
    preferred_name?: TranslatableString,
    alt_name?: AltName,
    image: {main: string},
    tags?: string[],
}

export interface PonyType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'pony',
    note: object,
    preferred_name: TranslatableString,
    description: TranslatableString,
    tags: string[],
    image: {
        portrait: string,
        main: string,
    },
    location: Location,
    house: string,
    inns: string[],
    changeling: {
        id: string,
        IAmAlterSet: boolean,
    },
    group_master: boolean,
    group: string[],
    max_level: boolean,
    rewards: StarReward[],
    minigame: {
        can_play_minecart: boolean,
        cooldown: number,
        skip_cost: number,
        exp_rank: number,
    },
    arrival_xp: number,
    unlock_level: number,
    cost: Cost,
    tasks: {[ type: string ]: {
                "name": TranslatableString,
                "time": number,
                "xp": number,
                "bits": number,
                "gems": number,
                "token": string,
                "chance": number,
                "token_amount": number,
                "requires": string,
            }
        },
    pro: string | null,
    collections: string[],
    wiki_path: string,
}

export interface HouseType extends Omit<GenericObjectType, 'category'> {
    category: 'house',
    preferred_name: TranslatableString,
    location: Location[],
    grid_size: number,
    build: {
        time: number,
        skip_cost: number,
        xp: number,
    },
    residents: string[],
    visitors: string[],
    tags: string[],
}

export interface ShopType extends Omit<HouseType, 'category' | 'location'> {
    category: 'shop',
    unlock_level: number,
    location: Location,
    product: {
        name: TranslatableString,
        image: string,
        time: number,
        skip_cost: number,
        xp: number,
        bits: number,
        gems: number,
        tls: number,
    },
    can_sell: boolean,
    cost: Cost,
}

export interface DecorType extends Omit<GenericObjectType, 'category'> {
    category: 'decor',
    image: {main: string},
    location: Location,
    unlock_level: number,
    limit: number,
    grid_size: number,
    xp: number,
    cost: Cost,
    fusion_points: number,
    pro: {
        is_pro: boolean,
        size: number,
        time: number,
        bits: number,
    },
}

export interface ItemType extends Omit<GenericObjectType, 'category'> {
    category: 'item',
    alt_ids: string[],
}

export interface TokenType extends Omit<GenericObjectType, 'category'> {
    category: 'token',
    chance: number,
    tasks: string[],
    unlimited: boolean,
    no_reset: boolean,
}

export interface AvatarType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'avatar',
    image: {
        main: string,
        preview: string,
    },
    is_default: boolean,
    pony: string,
}

interface GroupQuests {
    random_pros: string[],
    quests: {[ type: string ]: {
        name: TranslatableString,
        description: TranslatableString,
        pro: string[],
    }}
}

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

export type Currency = 'Gems' | 'Bits' | GameObjectId

export type CategoryName = 'pony' |
                    'house' |
                    'shop' |
                    'decor' |
                    'avatar' |
                    'avatar_frame' |
                    'background' |
                    'background_frame' |
                    'cutie_mark' |
                    'pet' |
                    'theme' |
                    'path' |
                    'item' |
                    'booster' |
                    'token' |
                    'consumable' |
                    'costume' |
                    'costume_part'

export type CategoryType<T> = 
    T extends 'pony' ? PonyType :
    T extends 'house' ? HouseType :
    T extends 'shop' ? ShopType :
    T extends 'decor' ? DecorType :
    T extends 'avatar' ? AvatarType :
    T extends 'avatar_frame' ? AvatarFrameType :
    T extends 'background' ? BackgroundType :
    T extends 'background_frame' ? BackgroundFrameType :
    T extends 'cutie_mark' ? CutieMarkType :
    T extends 'pet' ? PetType :
    T extends 'theme' ? ThemeType :
    T extends 'path' ? PathType :
    T extends 'item' ? ItemType :
    T extends 'booster' ? BoosterType :
    T extends 'token' ? TokenType :
    T extends 'consumable' ? ConsumableType :
    T extends 'costume' ? CostumeType :
    T extends 'costume_part' ? CostumePartType :
    T extends null ? GenericObjectType :
    never

export type GameObject = PonyType |
                        HouseType |
                        ShopType |
                        DecorType |
                        AvatarType |
                        AvatarFrameType |
                        BackgroundType |
                        BackgroundFrameType |
                        CutieMarkType |
                        PetType |
                        ThemeType |
                        PathType |
                        ItemType |
                        BoosterType |
                        TokenType |
                        ConsumableType |
                        CostumeType |
                        CostumePartType |
                        GenericObjectType

export interface GameObjects {
    file_version: number,
    pony: CategoryData<PonyType>,
    house: CategoryData<HouseType>,
    shop: CategoryData<ShopType>,
    decor: CategoryData<DecorType>,
    avatar: CategoryData<AvatarType>,
    avatar_frame: CategoryData<AvatarFrameType>,
    background_frame: CategoryData<BackgroundFrameType>,
    background: CategoryData<BackgroundType>,
    cutie_mark: CategoryData<CutieMarkType>,
    pet: CategoryData<PetType>,
    theme: CategoryData<ThemeType>,
    path: CategoryData<PathType>,
    item: CategoryData<ItemType>,
    booster: CategoryData<BoosterType>,
    token: CategoryData<TokenType>,
    consumable: CategoryData<ConsumableType>,
    costume: CategoryData<CostumeType>,
    costume_part: CategoryData<CostumePartType>,
}

interface CategoryData<T> {
    objects: Record<GameObjectId, T>,
}

export type TranslatableString = Record<Language, string>
type AltName = Partial<Record<Language, string[]>>

export interface RenamedFile {
    path: string,
    original?: string | null,
}

export type ImageBase<T extends string | void = void> = T extends string
                    ? Record<T | 'main', RenamedFile>
                    : Record<'main', RenamedFile>

export interface StarReward {
    item: string,
    amount: number,
}

export interface PriceBase {
    currency: Currency | null,
    amount: number,
}

export interface Price {
    base: PriceBase,
    token: GameObjectId | null,
    daily_goals: number,
}

interface GenericObjectType {
    index: number,
    id: string,
    category: CategoryName,
    name: TranslatableString,
    image: ImageBase,
    preferred_name?: TranslatableString | null,
    alt_name?: AltName | null,
    price?: Price | null,
    tags: string[],
}

export interface PonyType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'pony',
    description: TranslatableString,
    image: ImageBase<'portrait'>,
    location: Location,
    house: string | null,
    inns: GameObjectId[],
    changeling: ChangelingData,
    group_master: boolean,
    group: string[],
    max_level: boolean,
    rewards: StarReward[],
    minigame: MinigameData,
    arrival_xp: number,
    unlock_level: number,
    ai_type: number,
    not_pony: boolean,
    ban_pets: boolean,
    tasks: string[],
    pro: string[],
    collections: string[],
    costumes: string[],
    critter_farm: GameObjectId | null,
    wiki_path: string,
}

export interface ChangelingData {
    id: string,
    IAmAlterSet: boolean,
}

export interface MinigameData {
    can_play_minecart: boolean,
    hard_lock: boolean,
    cooldown: number,
    skip_cost: number,
    exp_rank: number,
    has_wings: boolean,
}

export interface HouseBuild {
    time: number,
    skip_cost: number,
    xp: number,
}

export interface HouseType extends Omit<GenericObjectType, 'category'> {
    category: 'house',
    location: Location[],
    grid_size: number,
    build: HouseBuild,
    residents: string[],
    visitors: string[],
    wiki_path: string,
}

export interface ShopType extends Omit<GenericObjectType, 'category'> {
    category: 'shop',
    grid_size: number,
    build: HouseBuild,
    residents: string[],
    visitors: string[],
    unlock_level: number,
    location: Location,
    product: GameObjectId,
    special: 'lotto' | 'ck_entrance' | 'ferris_wheel' | null,
    can_sell: boolean,
    cost: Price,
    wiki_path: string,
}

export interface DecorPro {
    is_pro: boolean,
    size: number,
    time: number,
    bits: number,
}

export interface DecorType extends Omit<GenericObjectType, 'category'> {
    category: 'decor',
    location: Location,
    unlock_level: number,
    limit: number,
    grid_size: number,
    xp: number,
    fusion_points: number,
    pro: DecorPro,
}

export interface ItemType extends Omit<GenericObjectType, 'category'> {
    category: 'item',
    alt_ids: string[],
}

export interface TokenType extends Omit<GenericObjectType, 'category'> {
    category: 'token',
    consumable: GameObjectId,
    chance: number,
    tasks: string[],
    unlimited: boolean,
    no_reset: boolean,
    special: number,
}

export interface AvatarType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'avatar',
    image: ImageBase<'preview'>,
    is_default: boolean,
    pony: GameObjectId | null,
    animated: boolean,
}

export interface AvatarFrameType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'avatar_frame',
    image: ImageBase<'preview'>,
    is_default: boolean,
    animated: boolean,
}

export interface BackgroundType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'background',
    image: ImageBase<'preview'>,
    is_default: boolean,
}

export interface BackgroundFrameType extends Omit<GenericObjectType, 'category'> {
    category: 'background_frame',
    is_default: boolean,
}

export interface CutieMarkType extends Omit<GenericObjectType, 'category'> {
    category: 'cutie_mark',
    pony: GameObjectId,
    is_default: boolean,
}

export interface PetType extends Omit<GenericObjectType, 'category'> {
    category: 'pet',
    pony: GameObjectId,
    flying: boolean,
    task_bonus: number,
    minecart_bonus: number,
}

export interface ThemeType extends Omit<GenericObjectType, 'category'> {
    category: 'theme',
    location: Location,
    season: string,
    shop_bonus: number,
    quest: string,
    texture_suffix: string,
}

export interface PathType extends Omit<GenericObjectType, 'category'> {
    category: 'path',
    location: Location,
    sprite: string,
}

export interface BoosterType extends Omit<GenericObjectType, 'category'> {
    category: 'booster',
    type: 'xp' | 'bits' | null,
    time: number,
    multiplier: number,
}

export interface FarmCost {
    shard: GameObjectId,
    shard_cost: number,
    item: GameObjectId,
    item_cost: number,
}

export interface CritterUpgrade {
    currency: GameObjectId,
    cost: number,
    shard: GameObjectId,
    shard_cost: number,
}

export interface ConsumableCritter {
    critter: GameObjectId,
    main_feed: GameObjectId,
    additional_feed: GameObjectId,
    phases: { main: number, additional: number }[],
    upgrade: CritterUpgrade,
    final_cooldown: number,
    final_reward: { gems: number, xp: number },
}

export interface ConsumableType extends Omit<GenericObjectType, 'category'> {
    category: 'consumable',
    consume: Partial<Record<'xp' | 'bits' | 'gems' | 'hearts' | 'wheels' | 'blitz_energy' | 'tls', number>>,
    time: number,
    skip_cost: number,
    farm?: FarmCost[] | null,
    critter?: ConsumableCritter | null,
}

export interface CostumeBonus {
    type: 'MineCart' | 'ShopProduction' | 'MiniGames' | '',
    amount: number,
}

export interface CostumeType extends Omit<GenericObjectType, 'category' | 'image'> {
    category: 'costume',
    image: ImageBase<'alt'>,
    pony: GameObjectId,
    enabled: boolean,
    can_be_new: boolean,
    is_subset: boolean,
    is_only_alternate_mesh: boolean,
    parts: { body: GameObjectId | null, mane: GameObjectId | null, tail: GameObjectId | null },
    bonus: CostumeBonus,
    tls_background: RenamedFile | null,
    subsets: GameObjectId[],
}

export interface CostumePartType {
    index: number,
    id: GameObjectId,
    name?: TranslatableString, // This doesn't exist, it's so typing is cleaner
    category: 'costume_part',
    image: ImageBase<'alt'>,
    model_name: string,
    linked_part: GameObjectId | null,
    type: 'body' | 'mane' | 'tail',
    apply_time: number,
    apply_cost: number,
    materials: number[],
    gem_price: number,
}

export interface QuestDetail {
    name: TranslatableString,
    description: TranslatableString,
    pro: string[],
    special: 'seasonal' | 'tutorial' | null,
}

export interface GroupQuests {
    random_pros: string[],
    quests: Record<string, QuestDetail>,
}

export type FortuneShopRarities = 'common' | 'uncommon' | 'rare'
export type FortuneShopPrices = 'regular' | 'discount' | 'super' | 'ultra'

export interface FortuneShopItemPricesList {
    regular: Record<FortuneShopPrices, number>,
    royal: Record<FortuneShopPrices, number>,
}

export interface FortuneShopItem {
    id: GameObjectId,
    rarity: FortuneShopRarities,
    amount: number,
    prices: FortuneShopItemPricesList,
}

export interface FortuneShop {
    max_items_in_shop: number,
    refresh_cost: number,
    item_rarity_chances: Record<FortuneShopRarities, number>,
    item_price_chances: Record<FortuneShopPrices, number>,
    items: Record<FortuneShopRarities, Record<GameObjectId, FortuneShopItem>>,
}


export interface TasksData {
    tasks: Record<string, TaskEntry>
}

export interface TaskEntry {
    id: string
    index: number
    pony: GameObjectId
    name: TranslatableString
    image: RenamedFile
    requirement: TaskRequirement
    reward: TaskReward
    chance: number
    skip_cost: number
    duration: number
    hidden: boolean
}

export interface TaskReward {
    bits: number
    gems: number
    xp: number
    consumable: GameObjectId
    consumable_amount: number
    token: GameObjectId
    token_amount: number
}

export interface TaskRequirement {
    pony: GameObjectId
    house: GameObjectId | '<Home>'
    quests: string[]
}


export interface CollectionData {
    collections: Record<string, CollectionType>,
    fashion_show: Record<string, FashionShowEntry>,
}

export interface CollectionItem {
    item: GameObjectId,
    alt: GameObjectId | null,
    count: number,
}

export interface CollectionType {
    index: number,
    id: string,
    name: TranslatableString,
    tags: string[],
    ponies: CollectionItem[],
    reward: CollectionReward,
    image: Record<Language, string>,
}

export interface FashionShowEntry {
    index: number,
    id: string,
    name: TranslatableString,
    items: {
        pony: GameObjectId,
        parts: GameObjectId[],
    }[],
    reward: CollectionReward,
}

export interface CollectionReward {
    main: CollectionRewardEntry,
    alt: CollectionRewardEntry,
}

export interface CollectionRewardEntry {
    item: GameObjectId,
    amount: number,
}

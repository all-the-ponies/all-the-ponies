import type { GameObjectId, ImageBase, TranslatableString } from "./gameDataTypes";

export interface MazeData {
    id: string,
    name: TranslatableString,
    image: ImageBase<'outro'>,
    map: MazeMap,
    shop_tiers: Record<string, MazeShopTier>,
    chest_rewards: Record<string, string[]>,
    ponies: Record<string, MazePonyType>,
    chests: Record<string, MazeChestType>,
    bosses: Record<string, MazeBossType>,
    shops: Record<string, MazeShopType>,
}

export interface MazeMap {
    blocks: MazeMapBlock[],
    shops: MazeMapShop[],
}

export interface MazeMapBlock {
    id: string,
    x: number,
    y: number,
    connections: {
        north_east: boolean,
        north_west: boolean,
        south_east: boolean,
        south_west: boolean,
    },
    uncovered: boolean,
    entity: MazeBlockEntity | null
}

export interface MazeBlockEntity {
    id: string,
    type: 'MazeBlock_Start' | 'MazeBoss' | 'MazeChest' | 'MazeShop',
}

export interface MazeMapShop {
    id: string,
    x: number,
    y: number,
}


export interface MazeShopTier {
    id: string,
    slots: MazeShopSlot[],
}

export interface MazeShopSlot {
    id: string,
    price: number,
}


export interface MazePonyType {
    id: string,
    pony: GameObjectId,
    power: number,
    fights: number,
    upgraded: boolean,
}

export interface MazeChestType {
    id: string,
    tier: string,
}

export interface MazeBossType {
    id: string,
    pony: GameObjectId,
    required_power: number,
    hp: number,
    required_energy: number,
    critical_multiplier: number,
    drop_chest: string,
    rewards: MazeBossReward[],
}

export interface MazeBossReward {
    item: GameObjectId,
    amount: number,
}

export interface MazeShopType {
    id: string,
    tier: string,
}

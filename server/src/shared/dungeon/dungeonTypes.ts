export const TILE_SIZE = 64;

export function tileToWorld(x: number, y: number): Vec2 {
    return {
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
    };
}

export type Vec2 = { x: number; y: number };

export enum TileType {
    Empty,
    Floor,
    Wall,
    Door,
}

export type ServerDungeon = {
    floors: Record<number, DungeonFloor>;
    worldBounds: {
        width: number;
        height: number;
    };
};

export type DungeonFloor = {
    map: TileType[][];
    rooms: Room[];
    playerSpawn: Vec2;
    exitSpawn: Vec2;
    enemies: EnemyData[];
    chests: ChestData[];
    portal: PortalData;
};

export type Room = {
    x: number;
    y: number;
    w: number;
    h: number;
    centerX: number;
    centerY: number;
};

export type EnemyData = {
    id: string;
    type: "demon";
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    damage: number;
};

export type ChestData = {
    id: string;
    x: number;
    y: number;
    items: any[];
    opened: boolean;
};

export type PortalData = {
    x: number;
    y: number;
    targetFloor: number | "hub";
};
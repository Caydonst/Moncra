export type Vec2 = { x: number; y: number };

export enum TileType {
    Empty,
    Floor,
    Wall,
    Door,
}

export const TILE_SIZE = 64;

export type Room = {
    x: number;
    y: number;
    w: number;
    h: number;
    centerX: number;
    centerY: number;
};

export type DungeonFloor = {
    map: TileType[][];
    rooms: Room[];
    playerSpawn: Vec2;
    exitSpawn: Vec2;
};

export type ServerDungeonData = {
    floors: Record<number, DungeonFloor>;
    worldBounds: {
        width: number;
        height: number;
    };
};

export function tileToWorld(x: number, y: number): Vec2 {
    return {
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
    };
}
import { TileType, TILE_SIZE } from "../../shared/dungeon/dungeonTypes.js";

function worldToTile(x: number, y: number) {
    return {
        tx: Math.floor(x / TILE_SIZE),
        ty: Math.floor(y / TILE_SIZE),
    };
}

function isWalkableTile(map: TileType[][], tx: number, ty: number) {
    if (ty < 0 || ty >= map.length) return false;
    if (tx < 0 || tx >= map[0].length) return false;

    const tile = map[ty][tx];
    return tile === TileType.Floor || tile === TileType.Door;
}

export function canMoveTo(
    map: TileType[][],
    x: number,
    y: number,
    width: number,
    height: number
) {
    const halfW = width / 2;
    const halfH = height / 2;

    const points = [
        { x: x - halfW, y: y - halfH },
        { x: x + halfW, y: y - halfH },
        { x: x - halfW, y: y + halfH },
        { x: x + halfW, y: y + halfH },
    ];

    return points.every((p) => {
        const { tx, ty } = worldToTile(p.x, p.y);
        return isWalkableTile(map, tx, ty);
    });
}
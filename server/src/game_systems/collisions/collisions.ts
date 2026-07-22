import {
    TileType,
    TILE_SIZE,
} from "../../shared/dungeon/dungeonTypes.js";

function worldToTile(x: number, y: number) {
    return {
        tx: Math.floor(x / TILE_SIZE),
        ty: Math.floor(y / TILE_SIZE),
    };
}

function isWalkableTile(
    map: TileType[][],
    tileX: number,
    tileY: number
): boolean {
    if (
        tileY < 0 ||
        tileY >= map.length ||
        tileX < 0 ||
        tileX >= map[0].length
    ) {
        return false;
    }

    const tile = map[tileY][tileX];

    return (
        tile === TileType.Floor ||
        tile === TileType.Door
    );
}

export function canMoveTo(
    map: TileType[][],
    x: number,
    y: number,
    width: number,
    height: number
): boolean {
    const halfW = width / 2;
    const halfH = height / 2;

    const points = [
        {
            x: x - halfW,
            y: y - halfH,
        },
        {
            x: x + halfW,
            y: y - halfH,
        },
        {
            x: x - halfW,
            y: y + halfH,
        },
        {
            x: x + halfW,
            y: y + halfH,
        },
    ];

    return points.every((point) => {
        const { tx, ty } = worldToTile(
            point.x,
            point.y
        );

        return isWalkableTile(
            map,
            tx,
            ty
        );
    });
}
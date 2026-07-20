export const TILE_SIZE = 64;
export function tileToWorld(x, y) {
    return {
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
    };
}
export var TileType;
(function (TileType) {
    TileType[TileType["Empty"] = 0] = "Empty";
    TileType[TileType["Floor"] = 1] = "Floor";
    TileType[TileType["Wall"] = 2] = "Wall";
    TileType[TileType["Door"] = 3] = "Door";
})(TileType || (TileType = {}));
//# sourceMappingURL=dungeonTypes.js.map
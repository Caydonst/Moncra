import * as ex from "excalibur";
import type { DungeonFloor } from "@/lib/shared/dungeon/dungeonTypes";
import { TileType, TILE_SIZE, tileToWorld } from "@/lib/shared/dungeon/dungeonTypes";

export function createTileMapFromDungeonFloor(
  dungeonMap: TileType[][],
  tileset: ex.SpriteSheet
) {
  const rows = dungeonMap.length;
  const cols = dungeonMap[0].length;

  const tileMap = new ex.TileMap({
    rows,
    columns: cols,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });

  const floorSprite = tileset.sprites[0];
  const wallSprite = tileset.sprites[1];
  const doorSprite = tileset.sprites[2];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = tileMap.getTile(x, y);
      const type = dungeonMap[y][x];

      if (type === TileType.Empty) continue;

      if (type === TileType.Floor) {
        tile.addGraphic(floorSprite);
        tile.solid = false;
      }

      if (type === TileType.Wall) {
        tile.addGraphic(wallSprite);
        tile.solid = true;
      }

      if (type === TileType.Door) {
        tile.addGraphic(doorSprite);
        tile.solid = false;
      }
    }
  }

  return tileMap;
}

export function tileVec(x: number, y: number) {
  const pos = tileToWorld(x, y);
  return ex.vec(pos.x, pos.y);
}
import * as ex from "excalibur"

export class DungeonScene extends ex.Scene {
  currentFloor = 0;
  

  floorData!: DungeonFloorData;
  tileMap!: ex.TileMap;

  loadFloor(floorNumber: number) {
    // remove old floor
    if (this.tileMap) {
      this.tileMap.kill();
    }

    // generate new floor
    this.floorData = generateDungeon(60, 60);

    this.tileMap = createTileMapFromDungeon(
      this.floorData.map,
      this.resources.tileset
    );

    this.add(this.tileMap);

    // move player to new spawn
    this.player.pos = this.floorData.playerSpawn;
  }
}
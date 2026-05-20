import * as ex from "excalibur"
import { Portal } from "../portal";
import { Chest } from "../chest";
import { createTileMapFromDungeonFloor, generateDungeonFloor, tileToWorld } from "../utils/mapGenerator";
import { GameResources } from "../resources";
import { Player } from "../player";
import { GameState } from "../gameState/gameState";

export class DungeonScene extends ex.Scene {
  private currentFloor: number = 1;
  private dungeon!: Dungeon;
  private player!: Player;
  private worldBounds!: {
      width: number;
      height: number;
  };

  constructor(private resources: GameResources, private gameState: GameState) {
    super()
  }

  onInitialize(engine: ex.Engine): void {

    this.camera.zoom = 1.20

    this.dungeon = generateDungeon(this.resources);
    this.player = this.gameState.player;
    this.add(this.player);
    this.player.attachToScene(this);

    this.worldBounds = this.dungeon.worldBounds;

    this.loadFloor();
  }

  onPostUpdate(engine: ex.Engine, delta: number) {
      const camera = engine.currentScene.camera;

      // Center directly on player
      const targetPos = this.player.pos;

      // Map/world size
      const mapWidth = this.worldBounds.width;
      const mapHeight = this.worldBounds.height;

      // Account for zoom
      const halfScreenW = (engine.drawWidth / camera.zoom) / 2;
      const halfScreenH = (engine.drawHeight / camera.zoom) / 2;

      // Clamp camera inside map bounds
      const clampedX = Math.max(
          halfScreenW,
          Math.min(mapWidth - halfScreenW, targetPos.x)
      );

      const clampedY = Math.max(
          halfScreenH,
          Math.min(mapHeight - halfScreenH, targetPos.y)
      );

      camera.pos = ex.vec(clampedX, clampedY);
  }

  loadFloor() {
    if (this.currentFloor === 1) {
      this.dungeon.floors[this.currentFloor]?.draw(this);
      this.player.pos = tileToWorld(this.dungeon.floors[this.currentFloor]?.tileLayer.playerSpawn.x, this.dungeon.floors[this.currentFloor]?.tileLayer.playerSpawn.y)
    } else {
      if (this.currentFloor) {
          this.dungeon.floors[this.currentFloor]?.kill()
      }

      this.currentFloor++

      this.dungeon.floors[this.currentFloor]?.draw(this);

      this.player.pos = tileToWorld(this.dungeon.floors[this.currentFloor]?.tileLayer.playerSpawn.x, this.dungeon.floors[this.currentFloor]?.tileLayer.playerSpawn.y)
      this.player.z = 20;
    }

    console.log("Dungeon Loaded");
  }
  
}

class Dungeon {
  public floors: Record<number, Floor | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  }
  public worldBounds!: {
      width: number;
      height: number;
  };

  constructor() {

  }


}

class Floor {
  public chests: Chest[] = [];
  public portal!: Portal;
  public enemies = [];
  public tileLayer!;
  public tileMap!: ex.TileMap;

  constructor() {

  }

  draw(scene: ex.Scene) {
    scene.add(this.tileMap);
    this.chests.forEach(chest => {
      scene.add(chest);
    })
  }

  kill() {
    this.tileMap?.kill();

    this.chests.forEach(chest => chest.kill());
    //this.enemies.forEach(enemy => enemy.kill());
    this.portal?.kill();
  }
}

function generateDungeon(resources: GameResources) {
  const dungeon = new Dungeon();

  const floorWidth = 70;
  const floorHeight = 70;

  for (let i = 0; i < 5; i++) {
    const floor = generateFloor(resources, floorWidth, floorHeight);
    dungeon.floors[i+1] = floor;

  }

  dungeon.worldBounds = {
      width: floorWidth * 64,
      height: floorHeight * 64,
  };

  return dungeon;

}

function generateFloor(resources: GameResources, width: number, height: number) {
  let floor = new Floor;

  const generatedMap = generateDungeonFloor(width, height);
  floor.tileLayer = generatedMap;
  const tileMap = createTileMapFromDungeonFloor(generatedMap.map, resources.mapSpritesheet)
  floor.tileMap = tileMap;

  generatedMap.rooms.forEach(room => {
    if (Math.random() < 0.5) {

      // 10% chance
      const chest = new Chest(tileToWorld(room.centerX, room.centerY), resources, Array(12).fill(null))
      floor.chests.push(chest);

    }
  })

  //const portal = new Portal(tileToWorld(generatedMap.exitSpawn.x, generatedMap.exitSpawn.y));

  return floor;
}
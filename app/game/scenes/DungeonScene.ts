import * as ex from "excalibur"
import { Portal } from "../portal";
import { Chest } from "../chest";
import { createTileMapFromDungeonFloor, generateDungeonFloor, tileToWorld } from "../utils/mapGenerator";
import { GameResources } from "../resources";
import { Player } from "../player";
import { GameState } from "../gameState/gameState";
import { ProjectileManager } from "../utils/projectileManager";
import { DustParticleManager, ParticleManager } from "../utils/ParticleHelper";
import { Demon } from "../enemies/demon";

export class DungeonScene extends ex.Scene {
  private currentFloorIndex: number = 1;
  private currentFloor!: Floor | null;
  private numFloors = 5;
    private worldBounds!: {
      width: number;
      height: number;
  };
  private dungeon!: Dungeon;
  public player!: Player;
  public engine!: ex.Engine;
  private projectileManager!: ProjectileManager;
  particleManager!: ParticleManager;
  dustParticleManager!: DustParticleManager;

  constructor(private resources: GameResources, private gameState: GameState, public collisionGroups: any) {
    super()
  }

  onInitialize(engine: ex.Engine): void {

    this.engine = engine;

    this.camera.zoom = 1.20

    this.player = this.gameState.player;
    this.add(this.player);
    this.player.attachToScene(this);

    this.dungeon = generateDungeon(this, this.numFloors, this.resources);

    if (this.gameState.inventory.weapon) {
      this.gameState.inventory.equipWeapon(this.gameState.inventory.weapon, this);
    }

    this.worldBounds = this.dungeon.worldBounds;

    this.projectileManager = new ProjectileManager(
        this.resources,
        this.collisionGroups
    );
    this.add(this.projectileManager);

    this.dustParticleManager = new DustParticleManager();
    this.add(this.dustParticleManager);

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

      if (this.currentFloor?.portal.interacted) {
        if (this.currentFloorIndex === 5) {
          engine.goToScene("hub");
        }

        this.loadFloor();
      }
  }

  loadFloor() {
    if (this.currentFloor) {
      this.currentFloor.kill()
    }

    this.currentFloor = this.dungeon.floors[this.currentFloorIndex];

    this.currentFloor?.draw(this);

    this.player.pos = tileToWorld(this.currentFloor?.tileLayer.playerSpawn.x, this.currentFloor?.tileLayer.playerSpawn.y);

    this.currentFloorIndex++;

    console.log("Dungeon Loaded");
  }
  
}

class Dungeon {
  public floors: Record<number, Floor | null> = {}
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
  public enemies: Demon[] = [];
  public tileLayer!: any;
  public tileMap!: ex.TileMap;
  public numEnemies = 30;

  constructor() {

  }

  draw(scene: ex.Scene) {
    scene.add(this.tileMap);
    this.chests.forEach(chest => scene.add(chest))
    scene.add(this.portal);
    this.enemies.forEach(enemy => scene.add(enemy))
  }

  kill() {
    this.tileMap?.kill();

    this.chests.forEach(chest => chest.kill());
    this.enemies.forEach(enemy => enemy.kill());
    this.portal?.kill();
  }
}

function generateDungeon(scene: DungeonScene, numFloors: number, resources: GameResources) {
  const dungeon = new Dungeon();

  const floorWidth = 60;
  const floorHeight = 60;

  for (let i = 0; i < numFloors; i++) {
    const floor = generateFloor(scene, resources, floorWidth, floorHeight);
    dungeon.floors[i+1] = floor;

  }

  dungeon.worldBounds = {
      width: floorWidth * 64,
      height: floorHeight * 64,
  };

  return dungeon;

}

function generateFloor(scene: DungeonScene, resources: GameResources, width: number, height: number) {
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

  for (let i = 0; i < floor.numEnemies; i++) {
    

    const enemy = new Demon(
      scene.engine,
      getRandomEnemySpawn(generatedMap),
      scene.player,
      100,
      100,
      resources,
      scene.collisionGroups,
    )

    floor.enemies.push(enemy);
  }

  const portal = new Portal(tileToWorld(generatedMap.exitSpawn.x, generatedMap.exitSpawn.y), resources, "dungeon");

  floor.portal = portal;

  return floor;
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomEnemySpawn(generatedMap: any) {
    const room = generatedMap.rooms[
        Math.floor(Math.random() * generatedMap.rooms.length)
    ];

    const tileX = randomInt(room.x + 1, room.x + room.w - 2);
    const tileY = randomInt(room.y + 1, room.y + room.h - 2);

    return ex.vec(
        tileX * 64 + 32,
        tileY * 64 + 32
    );
}
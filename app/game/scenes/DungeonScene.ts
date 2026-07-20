import * as ex from "excalibur";
import { Portal } from "../portal";
import { Chest } from "../chest/chest";
import { createTileMapFromDungeonFloor, tileVec } from "../utils/mapGenerator";
import { multiplayer } from "../network/multiplayer";
import { getPendingDungeon } from "../utils/sceneTransition";
import {
  DungeonFloor,
  TILE_SIZE,
} from "@/lib/shared/dungeon/dungeonTypes";
import { GameResources } from "../resources";
import { Player } from "../player/player";
import { GameState } from "../gameState/gameState";
import { ProjectileManager } from "../utils/projectileManager";
import { DustParticleManager } from "../utils/ParticleHelper";
import { Demon } from "../enemies/demon";

type ChestDefinition = {
  id: string;
  x: number;
  y: number;
  items: any[];
};

type PortalDefinition = {
  x: number;
  y: number;
  targetFloor: number | "hub";
};

type EnemyDefinition = {
  id: string;
  type: "demon";
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
};

type ServerDungeonFloor = DungeonFloor & {
  chests: ChestDefinition[];
  enemies: EnemyDefinition[];
  portal: PortalDefinition;
};

type ServerDungeonData = {
  floors: Record<number, ServerDungeonFloor>;
  worldBounds: {
    width: number;
    height: number;
  };
};

export class DungeonScene extends ex.Scene {
  private currentFloorIndex = 1;
  private currentFloor: Floor | null = null;
  public currentEnemies: Demon[] = [];

  private numFloors = 5;
  private worldBounds!: { width: number; height: number };
  private dungeon!: Dungeon;

  public player!: Player;
  public engine!: ex.Engine;

  private projectileManager!: ProjectileManager;
  dustParticleManager!: DustParticleManager;

  constructor(
    private resources: GameResources,
    private gameState: GameState,
    public collisionGroups: any
  ) {
    super();
  }

  onInitialize(engine: ex.Engine): void {
    this.engine = engine;
    this.camera.zoom = 1.2;

    this.player = this.gameState.player;
    this.add(this.player);
    this.player.attachToScene(this);

    if (this.gameState.inventory.weapon?.instance) {
      this.add(this.gameState.inventory.weapon.instance);
      this.gameState.inventory.weapon.instance.attachToScene(this);
    }
    console.log("GAME STATE: ", this.gameState.inventory);

    this.projectileManager = new ProjectileManager(
      this.resources,
      this.collisionGroups
    );
    this.add(this.projectileManager);

    this.dustParticleManager = new DustParticleManager();
    this.add(this.dustParticleManager);

    multiplayer.onDungeonReady((dungeonData: ServerDungeonData) => {
      this.buildDungeonFromServerDungeon(dungeonData);
    });
  }

  async onActivate() {
    const pendingDungeon = getPendingDungeon();

    await multiplayer.joinDungeon({
      engine: this.engine,
      resources: this.resources,
      scene: this,
      difficulty: pendingDungeon?.difficulty,
      localPlayer: this.player,
    });
  }

  onPostUpdate(engine: ex.Engine, delta: number) {
    if (!this.worldBounds || !this.currentFloor) return;

    const camera = engine.currentScene.camera;
    const targetPos = this.player.pos;

    const halfScreenW = engine.drawWidth / camera.zoom / 2;
    const halfScreenH = engine.drawHeight / camera.zoom / 2;

    const clampedX = Math.max(
        halfScreenW,
        Math.min(this.worldBounds.width - halfScreenW, targetPos.x)
    );

    const clampedY = Math.max(
      halfScreenH,
      Math.min(this.worldBounds.height - halfScreenH, targetPos.y)
    );

    const target = ex.vec(clampedX, clampedY);

    // Exponential smoothing that's framerate independent
    const followSpeed = 5; // Try 8–15

    const t = 1 - Math.exp(-followSpeed * (delta / 1000));

    camera.pos = camera.pos.lerp(target, t);

    if (this.currentFloor.portal.interacted) {
      const targetFloor = this.currentFloor.portalTarget;

      if (targetFloor === "hub") {
        engine.goToScene("hub");
        return;
      }

      multiplayer.sendFloorChange(targetFloor);

      this.currentFloorIndex = targetFloor;
      this.loadFloor();
    }
  }

  loadFloor() {
    this.currentFloor?.kill();

    this.currentFloor = this.dungeon.floors[this.currentFloorIndex];

    if (!this.currentFloor) {
      console.warn("Missing floor:", this.currentFloorIndex);
      return;
    }

    this.currentFloor.draw(this);

    const spawn = this.currentFloor.tileLayer.playerSpawn;
    this.player.pos = tileVec(spawn.x, spawn.y);

    this.currentEnemies = this.currentFloor.enemies;

    console.log(`Dungeon floor ${this.currentFloorIndex} loaded`);
  }

  private buildDungeonFromServerDungeon(dungeonData: ServerDungeonData) {
    this.dungeon = buildClientDungeon(dungeonData, this.resources);

    this.worldBounds = this.dungeon.worldBounds;
    this.numFloors = Object.keys(this.dungeon.floors).length;
    this.currentFloorIndex = 1;

    this.loadFloor();
  }
}

class Dungeon {
  public floors: Record<number, Floor> = {};
  public worldBounds!: {
    width: number;
    height: number;
  };
}

class Floor {
  public chests: Chest[] = [];
  public portal!: Portal;
  public portalTarget!: number | "hub";
  public enemies: Demon[] = [];

  public tileLayer!: ServerDungeonFloor;
  public tileMap!: ex.TileMap;

  draw(scene: ex.Scene) {
    scene.add(this.tileMap);
    this.chests.forEach(chest => scene.add(chest));
    scene.add(this.portal);
  }

  kill() {
    this.tileMap?.kill();
    this.chests.forEach(chest => chest.kill());
    this.enemies.forEach(enemy => enemy.destroyEnemy());
    this.portal?.kill();
  }
}

function buildClientDungeon(
  dungeonData: ServerDungeonData,
  resources: GameResources
) {
  const dungeon = new Dungeon();

  dungeon.worldBounds = dungeonData.worldBounds;

  for (const [floorNumber, floorData] of Object.entries(dungeonData.floors)) {
    dungeon.floors[Number(floorNumber)] = buildClientFloor(resources, floorData);
  }

  return dungeon;
}

function buildClientFloor(
  resources: GameResources,
  floorData: ServerDungeonFloor
) {
  const floor = new Floor();

  floor.tileLayer = floorData;

  floor.tileMap = createTileMapFromDungeonFloor(
    floorData.map,
    resources.mapSpritesheet
  );

  floorData.enemies.forEach(enemyData => {
    if (enemyData.type !== "demon") return;

    const demon = new Demon(
      {
        id: enemyData.id,
        type: enemyData.type,
        x: enemyData.x,
        y: enemyData.y,
        vx: 0,
        vy: 0,
        hp: enemyData.hp,
        maxHp: enemyData.maxHp,
        isDead: false,
        isAggro: false,
        state: "idle",
      },
      resources
    );

    floor.enemies.push(demon);
  });

  floorData.chests.forEach(chestData => {
    const chest = new Chest(
      ex.vec(chestData.x, chestData.y),
      resources,
      chestData.items
    );

    floor.chests.push(chest);
  });

  floor.portal = new Portal(
    ex.vec(floorData.portal.x, floorData.portal.y),
    resources,
    "dungeon"
  );

  floor.portalTarget = floorData.portal.targetFloor;

  return floor;
}
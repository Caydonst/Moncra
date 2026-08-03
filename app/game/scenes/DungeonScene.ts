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
import { returnToHub } from "../utils/sceneTransition";

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
  public get currentEnemies(): Demon[] {
    return multiplayer.getCurrentEnemyActors();
  }

  private numFloors = 5;
  private worldBounds!: { width: number; height: number };
  private dungeon!: Dungeon;

  public player!: Player;
  public engine!: ex.Engine;

  private projectileManager!: ProjectileManager;
  dustParticleManager!: DustParticleManager;

  private isTransitioning = false;

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

    const fpsText = new ex.Text({
      text: "FPS: 0",
      font: new ex.Font({
        size: 20,
        family: "Arial",
        color: ex.Color.White,
      }),
    });

    const fpsHud = new ex.ScreenElement({
      pos: ex.vec(20, 90),
      anchor: ex.vec(0, 0),
      z: 9999,
    });

    fpsHud.graphics.use(fpsText);

    // Use the scene directly, not engine.currentScene.
    this.add(fpsHud);

    fpsHud.on("postupdate", () => {
      fpsText.text =
        `FPS: ${Math.round(engine.stats.currFrame.fps)}`;
    });

    this.projectileManager =
      new ProjectileManager(
        this.resources,
        this.collisionGroups
      );

    this.add(this.projectileManager);

    this.dustParticleManager =
      new DustParticleManager();

    this.add(this.dustParticleManager);

    multiplayer.onDungeonReady(
      (dungeonData: ServerDungeonData) => {
        this.buildDungeonFromServerDungeon(
          dungeonData
        );
      }
    );
  }

  async onActivate(): Promise<void> {
    this.isTransitioning = false;

    const player = this.gameState.player;

    if (!player) {
      throw new Error(
        "Cannot enter DungeonScene without a player."
      );
    }

    this.player = player;
    this.player.attachToScene(this);

    this.attachEquippedWeaponToScene(this);

    const pendingDungeon =
      getPendingDungeon();

    await multiplayer.joinDungeon({
      engine: this.engine,
      resources: this.resources,
      scene: this,
      difficulty: pendingDungeon?.difficulty,
      localPlayer: this.player,
    });
  }

  onDeactivate(): void {
    this.isTransitioning = false;

    if (this.currentFloor?.portal) {
      this.currentFloor.portal
        .setInteractionEnabled(false);
    }
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

    if (
      this.currentFloor.portal.interacted &&
      !this.isTransitioning
    ) {
      const portal = this.currentFloor.portal;
      const targetFloor = this.currentFloor.portalTarget;

      portal.interacted = false;
      portal.setInteractionEnabled(false);

      if (targetFloor === "hub") {
        this.isTransitioning = true;

        this.detachPersistentActors();

        returnToHub();
        return;
      }

      multiplayer.sendFloorChange(targetFloor);

      this.currentFloorIndex = targetFloor;
      this.loadFloor();
    }
  }

  private detachPersistentActors(): void {
    this.player.vel = ex.vec(0, 0);
    this.player.detachFromScene(this);

    const weapon =
      this.gameState.inventory.weapon?.instance;

    if (weapon) {
      weapon.detachFromScene(this);
    }
  }

  loadFloor() {
    this.currentFloor?.kill();

    this.currentFloor =
      this.dungeon.floors[
      this.currentFloorIndex
      ];

    if (!this.currentFloor) {
      console.warn(
        "Missing floor:",
        this.currentFloorIndex
      );

      return;
    }

    this.currentFloor.draw(this);

    const spawn =
      this.currentFloor.tileLayer.playerSpawn;

    this.player.pos = tileVec(
      spawn.x,
      spawn.y
    );

    multiplayer.setCurrentDungeonFloor(
      this.currentFloorIndex
    );

    console.log(
      `Dungeon floor ${this.currentFloorIndex} loaded`
    );
  }

  private buildDungeonFromServerDungeon(dungeonData: ServerDungeonData) {
    this.dungeon = buildClientDungeon(dungeonData, this.resources);

    this.worldBounds = this.dungeon.worldBounds;
    this.numFloors = Object.keys(this.dungeon.floors).length;
    this.currentFloorIndex = 1;

    this.loadFloor();
  }

  private syncEquippedWeapon(): void {
    const weapon =
      this.gameState.inventory.weapon?.instance;

    if (!weapon) {
      return;
    }

    if (weapon.isKilled()) {
      console.error(
        "Equipped weapon was killed and cannot be transferred.",
        weapon
      );

      return;
    }

    weapon.attachToScene(this);
  }

  private attachEquippedWeaponToScene(
    scene: ex.Scene
  ): void {
    const weapon =
      this.gameState.inventory.weapon?.instance;

    if (!weapon) {
      console.warn("No equipped weapon instance found.");
      return;
    }

    weapon.attachToScene(scene);

    console.log("Weapon attached:", {
      weaponScene: weapon.scene,
      targetScene: scene,
      attached: weapon.scene === scene,
      killed: weapon.isKilled(),
    });
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

  public tileLayer!: ServerDungeonFloor;
  public tileMap!: ex.TileMap;

  draw(scene: ex.Scene) {
    scene.add(this.tileMap);

    this.chests.forEach((chest) => {
      scene.add(chest);
    });

    scene.add(this.portal);
    this.portal.setInteractionEnabled(true);
  }

  kill() {
    this.portal?.setInteractionEnabled(false);

    this.tileMap?.kill();

    this.chests.forEach((chest) => {
      chest.kill();
    });

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
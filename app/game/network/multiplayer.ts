import * as ex from "excalibur";
import { Client, Room, Callbacks } from "@colyseus/sdk";
import { GameState, PlayerState } from "../../../server/src/schemas/GameState"
import { GameResources } from "../resources";
import { RemotePlayer } from "../network/RemotePlayer";
import { Demon } from "../enemies/demon";
import type { DungeonFloor, ServerDungeonData } from "@/lib/shared/dungeon/dungeonTypes";
import { ServerPlayerDebug } from "../player/ServerPlayerDebug";
import {gameState} from "../gameState/gameState"
import { createClient } from "@/lib/supabase/client";

type RoomKind = "hub" | "party" | "dungeon";

class MultiplayerManager {
  client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL!);
  room: Room | null = null;
  callbacks: any = null;

  currentRoomKind: RoomKind | null = null;

  dungeon: ServerDungeonData | null = null;
  enemyActors = new Map<string, Demon>();
  private enemyStates = new Map<string, any>();
  private currentDungeonFloor = 1;
  private dungeonScene: ex.Scene | null = null;
  private dungeonResources: GameResources | null = null;
  
  remotePlayers = new Map<string, RemotePlayer>();
  private serverPlayerDebug: ServerPlayerDebug | null = null;

  private dungeonListeners: ((dungeon: ServerDungeonData) => void)[] = [];
  private localWeapon: any = null;

  isInDungeon() {
    return this.currentRoomKind === "dungeon";
  }

  canUseCombatMessages() {
    return this.currentRoomKind === "dungeon" && !!this.room;
  }

  setLocalWeapon(weapon: any) {
    this.localWeapon = weapon;
  }

  onDungeonReady(callback: (dungeon: ServerDungeonData) => void) {
    if (this.dungeon) {
      callback(this.dungeon);
      return;
    }

    this.dungeonListeners.push(callback);
  }

  private setDungeon(dungeon: ServerDungeonData) {
    this.dungeon = dungeon;
    this.dungeonListeners.forEach(callback => callback(dungeon));
    this.dungeonListeners = [];
  }

  async joinDungeon(options: {
    engine: ex.Engine;
    resources: GameResources;
    scene: ex.Scene;
    dungeonId?: string;
    difficulty?: string;
  }) {
    const { engine, resources, scene, dungeonId, difficulty } = options;
    if (this.room) {
      await this.room.leave();
    }

    const supabase = createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    this.room = await this.client.joinOrCreate(
      "dungeon_room",
      {
        accessToken: session.access_token,
      }
    );

    this.currentRoomKind = "dungeon";
    this.callbacks = Callbacks.get(this.room);

    this.room.onLeave((code) => {
      for (const enemyId of this.enemyActors.keys()) {
        this.removeDungeonEnemyActor(enemyId);
      }

      this.enemyStates.clear();

      this.dungeonScene = null;
      this.dungeonResources = null;
      this.currentDungeonFloor = 1;

      if (code === 4001) {
        window.location.href =
          "/?reason=logged_in_elsewhere";
      }

      console.warn(
        "Left dungeon room:",
        code
      );

      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    });

    console.log("Joined dungeon:", this.room.sessionId);

    this.setupDungeonRoomListeners(engine, scene, resources);
    this.setupInventoryListeners();
    this.sendGetInventory();

    this.room.send("get_existing_players");
    this.room.send("get_dungeon");
  }

  setupDungeonRoomListeners(engine: ex.Engine, scene: ex.Scene, resources: GameResources) {
    if (!this.room || !this.callbacks) return;

    this.dungeonScene = scene;
    this.dungeonResources = resources;

    console.log("Dungeon rendering context set:", {
      hasScene: !!this.dungeonScene,
      hasResources: !!this.dungeonResources,
    });

    const addRemotePlayer = (player: any, sessionId: string) => {
      if (sessionId === this.room?.sessionId) return;
      if (this.remotePlayers.has(sessionId)) return;

      const remotePlayer = new RemotePlayer(
        ex.vec(player.x, player.y),
        resources,
      );

      scene.add(remotePlayer);
      this.remotePlayers.set(sessionId, remotePlayer);

      this.callbacks!.onChange(player, () => {
        remotePlayer.updateFromNetwork(player, engine);
      });
    };

    this.room.onMessage("existing_players", (data: any) => {
      console.log(data);
      data.players.forEach((p: any) => {
        addRemotePlayer(p, p.sessionId);
      });
    });

    this.room.onMessage("dungeon_data", (data) => {
      console.log("Dungeon received:", data.dungeon);

      this.setDungeon(data.dungeon);
    });

    this.room.onMessage("weapon_attack", (data: any) => {
      if (data.sessionId === this.room?.sessionId) {
        this.localWeapon?.confirmServerAttack(data);
        return;
      }

      const remotePlayer = this.remotePlayers.get(data.sessionId);
      if (!remotePlayer) return;

      remotePlayer.playWeaponAttack(data);
    });

    this.room.onMessage("weapon_attack_start", (data: any) => {
      if (data.sessionId === this.room?.sessionId) return;

      const remotePlayer = this.remotePlayers.get(data.sessionId);
      if (!remotePlayer) return;

      remotePlayer.playWeaponAttackStart(data);
    });

    this.room.onMessage("weapon_attack_release", (data: any) => {
      if (data.sessionId === this.room?.sessionId) return;

      const remotePlayer = this.remotePlayers.get(data.sessionId);
      if (!remotePlayer) return;

      remotePlayer.playWeaponAttackRelease(data);
    });

    this.callbacks.onAdd("players", (player: any, sessionId: string) => {
      if (sessionId === this.room?.sessionId) {
        this.setupLocalPlayerCallbacks(player);

        if (!this.serverPlayerDebug) {
          this.serverPlayerDebug = new ServerPlayerDebug();
          scene.add(this.serverPlayerDebug);
        }

        const localPlayer = scene.actors.find(a => a.name === "player") as any;

        this.callbacks!.onChange(player, () => {
          this.serverPlayerDebug!.pos.setTo(player.x, player.y);

          localPlayer?.reconcileServerPosition?.(player.x, player.y);
        });

        return;
      }

      addRemotePlayer(player, sessionId);
    });

    this.callbacks.onRemove("players", (_player: any, sessionId: string) => {
      const remotePlayer = this.remotePlayers.get(sessionId);
      if (!remotePlayer) return;

      scene.remove(remotePlayer);
      this.remotePlayers.delete(sessionId);
    });

    this.callbacks.onAdd(
      "enemies",
      (enemyState: any, enemyId: string) => {

        this.enemyStates.set(
          enemyId,
          enemyState
        );

        this.syncDungeonEnemy(
          enemyId,
          enemyState
        );

        this.callbacks!.onChange(
          enemyState,
          () => {
            this.syncDungeonEnemy(
              enemyId,
              enemyState
            );
          }
        );
      }
    );

    this.callbacks.onRemove(
      "enemies",
      (_enemyState: any, enemyId: string) => {
        this.enemyStates.delete(enemyId);
        this.removeDungeonEnemyActor(enemyId);
      }
    );

  }

  async joinHub(options: {
    engine: ex.Engine;
    resources: GameResources;
  }) {
    const { engine, resources } = options;
    if (this.room?.name === "hub_room") return;

    if (this.room) {
      await this.room.leave();
    }

    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "No Supabase access token is available."
      );
    }

    this.room = await this.client.joinOrCreate(
      "hub_room",
      {
        accessToken: session.access_token,
      }
    );

    this.currentRoomKind = "hub";
    this.callbacks = Callbacks.get(this.room);

    this.room.onLeave((code) => {
      if (code === 4001) {
        window.location.href =
          "/?reason=logged_in_elsewhere";
      }

      console.warn("Left hub room:", code);
      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    });

    console.log("Joined hub:", this.room.sessionId);

    this.setupHubRoomListeners();
    this.setupInventoryListeners();
    this.sendGetInventory();
  }

  private setupHubRoomListeners() {
    if (!this.room || !this.callbacks) return;

    this.callbacks.onAdd("players", (player: any, sessionId: string) => {
      if (sessionId === this.room?.sessionId) {
        this.setupLocalPlayerCallbacks(player);
        return;
      }
    });
  }

  async joinPartyRoom(options: {
    engine: ex.Engine;
    resources: GameResources;
    scene: ex.Scene;
  }) {
    const { engine, resources, scene } = options;

    if (this.room?.name === "party_room") return;

    if (this.room) {
      await this.room.leave();
    }

    const supabase = createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    this.room = await this.client.joinOrCreate(
      "party_room",
      {
        accessToken: session.access_token,
      }
    );

    this.currentRoomKind = "party";
    this.callbacks = Callbacks.get(this.room);

    this.room.onLeave((code) => {
      if (code === 4001) {
        window.location.href =
          "/?reason=logged_in_elsewhere";
      }

      console.warn("Left party room:", code);
      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    });

    console.log("Joined party:", this.room.sessionId);

    this.setupPartyRoomListeners(engine, resources, scene);
    this.setupInventoryListeners();
    this.sendGetInventory();
  }

  private setupPartyRoomListeners(
    engine: ex.Engine,
    resources: GameResources,
    scene: ex.Scene
  ) {
    if (!this.room || !this.callbacks) return;

    const addRemotePlayer = (player: any, sessionId: string) => {
      if (sessionId === this.room?.sessionId) {
        this.setupLocalPlayerCallbacks(player);
        return;
      }

      if (this.remotePlayers.has(sessionId)) return;

      const remotePlayer = new RemotePlayer(
        ex.vec(player.x, player.y),
        resources
      );

      scene.add(remotePlayer);
      this.remotePlayers.set(sessionId, remotePlayer);

      this.callbacks!.onChange(player, () => {
        remotePlayer.updateFromNetwork(player, engine);
      });
    };

    this.callbacks.onAdd("players", addRemotePlayer);

    this.callbacks.onRemove("players", (_player: any, sessionId: string) => {
      const remotePlayer = this.remotePlayers.get(sessionId);
      if (!remotePlayer) return;

      remotePlayer.kill();
      this.remotePlayers.delete(sessionId);
    });
  }

  sendPlayerMove(data: {
    moveX: number;
    moveY: number;
    weapon?: any;
    aimAngle?: number;
    isAttacking?: boolean;
    attackId?: number
  }) {
    if (!this.room) return;

    this.room.send("player_move", data);
  }

  sendDash(data: { dirX: number; dirY: number }) {
    this.room?.send("player_dash", data);
  }

  sendWeaponAttack(data: {
    attackId: number;
    weaponId: string;
    aimAngle: number;
  }) {
    if (!this.room) return;
    if (!this.canUseCombatMessages()) return;

    this.room.send("weapon_attack", data);
  }

  private setupLocalPlayerCallbacks(player: PlayerState) {
    if (!this.callbacks) return;

    this.callbacks.onChange(player, () => {
      window.dispatchEvent(
        new CustomEvent("player_stats_updated", {
          detail: {
            hp: player.hp,
            maxHp: player.maxHp,
            damage: player.damage,
            armor: player.armor,
            crit: player.crit,
            power: player.power,
          },
        })
      );
    });
  }

  private setupInventoryListeners() {
    if (!this.room) return;

    this.room.onMessage("inventory_updated", (message: any) => {
      window.dispatchEvent(
        new CustomEvent("inventory_updated", {
          detail: message.inventory,
        })
      );
    });

    this.room.onMessage("item_upgraded", (message: any) => {
      window.dispatchEvent(
        new CustomEvent("item_upgraded", {
          detail: message,
        })
      );
    });

    this.room.onMessage("inventory_error", (message: any) => {
      console.error("Inventory error:", message.error);
    });
  }

  sendSwordHit(data: {
    attackId: number;
    enemyId: string;
    hitT: number;
    aimAngle: number | null;
  }) {
    if (!this.room) return;
    if (!this.canUseCombatMessages()) return;
    if (data.aimAngle === null) return;

    this.room.send("sword_hit", data);
  }

  sendEquipWeapon(weaponId: string) {
    if (!this.room) return;

    if (!this.canUseCombatMessages()) return;

    this.room.send("equip_weapon", {
      weaponId,
    });
  }

  sendGetInventory() {
    this.room?.send("get_inventory");
  }

  sendEquipItem(uid: string) {
    this.room?.send("equip_item", { uid });
  }

  sendUnequipItem(slot: "weapon" | "helmet" | "arms" | "chest" | "legs") {
    this.room?.send("unequip_item", { slot });
  }

  sendUpgradeItem(uid: string, statPoints: {damage: number, crit: number, hp: number, armor: number}) {
    this.room?.send("upgrade_item", { uid, statPoints });
  }

  sendFloorChange(targetFloor: number) {
    if (!this.room) return;
    this.room.send("floor_change", {
      targetFloor,
    });
  }

  private syncDungeonEnemy(
    enemyId: string,
    enemyState: any
  ) {
    const shouldRender =
      enemyState.currentFloor ===
      this.currentDungeonFloor;

    let demon = this.enemyActors.get(enemyId);

    if (!shouldRender) {
      if (demon) {
        this.removeDungeonEnemyActor(enemyId);
      }

      return;
    }

    if (!demon) {
      demon =
        this.spawnDungeonEnemy(
          enemyId,
          enemyState
        ) ?? undefined;
    }

    if (!demon) return;

    demon.updateFromServer({
      id: enemyId,
      type: enemyState.type,
      x: enemyState.x,
      y: enemyState.y,
      vx: enemyState.vx,
      vy: enemyState.vy,
      hp: enemyState.hp,
      maxHp: enemyState.maxHp,
      isDead: enemyState.isDead,
      isAggro: enemyState.isAggro,
      state: enemyState.state,
    });
  }

  private refreshDungeonEnemies() {
    // Remove actors that no longer belong
    // to the local player's floor.
    for (const [enemyId] of this.enemyActors) {
      const enemyState =
        this.enemyStates.get(enemyId);

      const shouldRender =
        enemyState?.currentFloor ===
        this.currentDungeonFloor;

      if (!shouldRender) {
        this.removeDungeonEnemyActor(enemyId);
      }
    }

    // Add or update every enemy belonging
    // to the new floor.
    for (const [enemyId, enemyState] of this.enemyStates) {
      this.syncDungeonEnemy(
        enemyId,
        enemyState
      );
    }
  }

  setCurrentDungeonFloor(floorNumber: number) {
    this.currentDungeonFloor = floorNumber;
    this.refreshDungeonEnemies();
  }

  getCurrentEnemyActors(): Demon[] {
    return Array.from(this.enemyActors.values());
  }

  private spawnDungeonEnemy(
    enemyId: string,
    enemyState: any
  ): Demon | null {
    if (!this.dungeonScene || !this.dungeonResources) {
      return null;
    }

    if (this.enemyActors.has(enemyId)) {
      return this.enemyActors.get(enemyId) ?? null;
    }

    if (enemyState.currentFloor !== this.currentDungeonFloor) {
      return null;
    }

    const demon = new Demon(
      {
        id: enemyId,
        type: enemyState.type,
        x: enemyState.x,
        y: enemyState.y,
        vx: enemyState.vx,
        vy: enemyState.vy,
        hp: enemyState.hp,
        maxHp: enemyState.maxHp,
        isDead: enemyState.isDead,
        isAggro: enemyState.isAggro,
        state: enemyState.state,
      },
      this.dungeonResources
    );

    this.dungeonScene.add(demon);
    this.enemyActors.set(enemyId, demon);

    return demon;
  }

  private removeDungeonEnemyActor(enemyId: string) {
    const demon = this.enemyActors.get(enemyId);
    if (!demon) return;

    demon.destroyEnemy();
    this.enemyActors.delete(enemyId);
  }

  async leaveCurrentRoom(reason = "unknown") {
    console.trace("Leaving room:", reason);

    if (!this.room) return;

    await this.room.leave();
    this.room = null;
  }
}


export const multiplayer = new MultiplayerManager();
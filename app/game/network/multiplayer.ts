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
import { Player } from "../player/player";
import { HubScene } from "../scenes/HubScene";

type RoomKind = "hub" | "party" | "dungeon";

type PartyMember = {
  sessionId: string;
  userId?: string;
  username: string;
  isLeader?: boolean;
  isReady?: boolean;
};

type PartyData = {
  roomCode: string | null;
  leaderSessionId: string | null;
  members: PartyMember[];
};

export class MultiplayerManager {
  client = new Client(process.env.NEXT_PUBLIC_COLYSEUS_URL!);
  room: Room | null = null;
  callbacks: any = null;

  private hubEngine: ex.Engine | null = null;
  private hubResources: GameResources | null = null;
  private hubScene: HubScene | null = null;
  private hubLocalPlayer: Player | null = null;

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

  private ACCOUNT_LOGGED_IN_ELSEWHERE = 4101;

  isInDungeon() {
    return this.currentRoomKind === "dungeon";
  }

  canUseCombatMessages(): boolean {
    return (
      (
        this.currentRoomKind === "dungeon" ||
        this.currentRoomKind === "party"
      ) &&
      !!this.room
    );
  }

  setLocalWeapon(weapon: any | null) {
    this.localWeapon = weapon;
  }

  onDungeonReady(
    callback: (
      dungeon: ServerDungeonData
    ) => void
  ): void {
    /*
     * DungeonScene registers this once in onInitialize,
     * so keep it registered for every future dungeon.
     */
    if (
      !this.dungeonListeners.includes(
        callback
      )
    ) {
      this.dungeonListeners.push(
        callback
      );
    }

    /*
     * Immediately provide the current dungeon when one
     * already exists.
     */
    if (this.dungeon) {
      callback(this.dungeon);
    }
  }

  private clearRemotePlayers(): void {
    for (const remotePlayer of this.remotePlayers.values()) {
      remotePlayer.kill();
    }

    this.remotePlayers.clear();
  }

  private setDungeon(
    dungeon: ServerDungeonData
  ): void {
    this.dungeon = dungeon;

    this.dungeonListeners.forEach(
      callback => {
        callback(dungeon);
      }
    );

    /*
     * Do not clear dungeonListeners here.
     */
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

      this.dungeon = null;

      if (
        code ===
        this.ACCOUNT_LOGGED_IN_ELSEWHERE
      ) {
        window.location.href =
          "/?reason=logged_in_elsewhere";

        return;
      }

      if (code === 4001) {
        console.warn(
          "Disconnected because the server shut down."
        );
      } else if (code === 4002) {
        console.error(
          "Disconnected because of a server error."
        );
      } else {
        console.warn(
          "Left dungeon room:",
          code
        );
      }

      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    });

    this.room.onError(
      (code, message) => {
        console.error(
          "Dungeon room error:",
          {
            code,
            message,
          }
        );
      }
    );

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
      console.log("RECEIVED WEAPON ATTACK:", data);

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
          //scene.add(this.serverPlayerDebug);
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
    scene: HubScene;
    localPlayer: Player;
  }): Promise<void> {
    const {
      engine,
      resources,
      scene,
      localPlayer,
    } = options;

    this.hubEngine =
      engine;

    this.hubResources =
      resources;

    this.hubScene =
      scene;

    this.hubLocalPlayer =
      localPlayer;

    /*
     * PartyRoom uses the same visible HubScene.
     * Do not replace it with a new HubRoom when
     * HubScene activates.
     */
    if (
      this.currentRoomKind === "party" &&
      this.room?.name === "party_room"
    ) {
      console.log(
        "Already connected to PartyRoom; skipping HubRoom join."
      );

      return;
    }

    if (
      this.currentRoomKind === "hub" &&
      this.room?.name === "hub_room"
    ) {
      return;
    }

    const supabase = createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(
        "Failed to read the Supabase session."
      );
    }

    if (!session?.access_token) {
      throw new Error(
        "No Supabase access token is available."
      );
    }

    if (this.room) {
      await this.room.leave(true);
    }

    this.clearRemotePlayers();

    const room =
      await this.client.create(
        "hub_room",
        {
          accessToken:
            session.access_token,
        }
      );

    this.setupHubConnection(
      room,
      {
        engine,
        resources,
        scene,
        localPlayer,
      }
    );

    console.log(
      "Created hub:",
      {
        roomId: room.roomId,
        sessionId: room.sessionId,
      }
    );
  }

  private setupHubRoomListeners(
    room: Room,
    engine: ex.Engine,
    resources: GameResources,
    scene: HubScene
  ): void {
    const callbacks = Callbacks.get(room);

    this.callbacks = callbacks;

    const addRemotePlayer = (
      player: any,
      sessionId: string
    ): void => {
      /*
       * The local schema player controls the existing
       * local Excalibur Player actor.
       */
      if (sessionId === room.sessionId) {
        this.setupLocalPlayerCallbacks(player);
        return;
      }

      /*
       * Avoid creating the same remote actor twice.
       */
      if (this.remotePlayers.has(sessionId)) {
        return;
      }

      const remotePlayer = new RemotePlayer(
        ex.vec(player.x, player.y),
        resources
      );

      this.remotePlayers.set(
        sessionId,
        remotePlayer
      );

      scene.add(remotePlayer);

      /*
       * Apply the initial state immediately instead of
       * waiting for the first schema change.
       */
      remotePlayer.updateFromNetwork(
        player,
        engine
      );

      callbacks.onChange(
        player,
        () => {
          remotePlayer.updateFromNetwork(
            player,
            engine
          );
        }
      );

      console.log(
        "Added remote hub player:",
        sessionId
      );
    };

    callbacks.onAdd(
      "players",
      addRemotePlayer
    );

    callbacks.onRemove(
      "players",
      (
        _player: any,
        sessionId: string
      ) => {
        const remotePlayer =
          this.remotePlayers.get(
            sessionId
          );

        if (!remotePlayer) {
          return;
        }

        remotePlayer.kill();

        this.remotePlayers.delete(
          sessionId
        );

        console.log(
          "Removed remote hub player:",
          sessionId
        );
      }
    );
  }

  getCurrentPartyCode(): string | null {
    if (
      this.currentRoomKind !==
      "party"
    ) {
      return null;
    }

    return this.room?.roomId ?? null;
  }

  async joinHubByCode(
    roomCode: string
  ): Promise<void> {
    const normalizedCode =
      roomCode
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      throw new Error(
        "Enter a room code."
      );
    }

    if (
      normalizedCode ===
      this.room?.roomId
    ) {
      throw new Error(
        "You are already in this room."
      );
    }

    /*
     * PartyMenu only provides the code, so reuse the HubScene
     * rendering context saved by joinHub().
     */
    const engine =
      this.hubEngine;

    const resources =
      this.hubResources;

    const scene =
      this.hubScene;

    const localPlayer =
      this.hubLocalPlayer;

    if (
      !engine ||
      !resources ||
      !scene ||
      !localPlayer
    ) {
      throw new Error(
        "The hub scene is not ready."
      );
    }

    const supabase =
      createClient();

    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      throw new Error(
        "Failed to read login session."
      );
    }

    const accessToken =
      session?.access_token;

    if (!accessToken) {
      throw new Error(
        "You are not logged in."
      );
    }

    const previousRoom =
      this.room;

    /*
     * Leave the current hub before joining the destination.
     * This avoids triggering the duplicate-login check.
     */
    if (previousRoom) {
      await previousRoom.leave(true);
    }

    /*
     * Remove remote actors belonging to the previous hub.
     */
    this.clearRemotePlayers();

    /*
     * Do this only after the previous room has finished leaving.
     */
    this.room = null;
    this.callbacks = null;
    this.currentRoomKind = null;

    try {
      const newRoom =
        await this.client.joinById(
          normalizedCode,
          {
            accessToken,
          }
        );

      this.setupHubConnection(
        newRoom,
        {
          engine,
          resources,
          scene,
          localPlayer,
        }
      );

      console.log(
        "Joined hub by code:",
        {
          roomId: newRoom.roomId,
          sessionId: newRoom.sessionId,
        }
      );
    } catch (error) {
      console.error(
        "Failed to join hub by code:",
        error
      );

      throw new Error(
        "That room code is invalid, full, or no longer active."
      );
    }
  }

  private setupHubConnection(
    room: Room,
    options: {
      engine: ex.Engine;
      resources: GameResources;
      scene: HubScene;
      localPlayer: Player;
    }
  ): void {
    this.room = room;
    this.currentRoomKind = "hub";

    this.hubEngine = options.engine;
    this.hubResources = options.resources;
    this.hubScene = options.scene;
    this.hubLocalPlayer = options.localPlayer;

    this.callbacks = Callbacks.get(room);

    this.setupHubRoomListeners(
      room,
      options.engine,
      options.resources,
      options.scene
    );

    this.setupInventoryListeners();
    this.sendGetInventory();

    this.setupHubLeaveHandler(room);

    console.log(
      "Hub connection configured:",
      {
        roomId: room.roomId,
        sessionId: room.sessionId,
      }
    );
  }

  private setupHubLeaveHandler(
    room: Room
  ): void {
    room.onLeave((code) => {
      if (
        code ===
        this.ACCOUNT_LOGGED_IN_ELSEWHERE
      ) {
        window.location.href =
          "/?reason=logged_in_elsewhere";

        return;
      }

      if (code === 4000) {
        console.log(
          "Left hub room intentionally:",
          room.roomId
        );
      } else if (code === 4001) {
        console.warn(
          "Disconnected because the server shut down."
        );
      } else if (code === 4002) {
        console.error(
          "Disconnected because of a server error."
        );
      } else {
        console.warn(
          "Left hub room:",
          room.roomId,
          code
        );
      }

      /*
       * This callback may belong to an older room.
       * Do not clear a newer active connection.
       */
      if (this.room !== room) {
        return;
      }

      this.clearRemotePlayers();

      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    });

    room.onError(
      (code, message) => {
        console.error(
          "Hub room error:",
          {
            roomId: room.roomId,
            code,
            message,
          }
        );
      }
    );
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
      if (
        code ===
        this.ACCOUNT_LOGGED_IN_ELSEWHERE
      ) {
        window.location.href =
          "/?reason=logged_in_elsewhere";

        return;
      }

      if (code === 4001) {
        console.warn(
          "Disconnected because the server shut down."
        );
      } else if (code === 4002) {
        console.error(
          "Disconnected because of a server error."
        );
      } else {
        console.warn(
          "Left party room:",
          code
        );
      }

      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    });

    this.room.onError(
      (code, message) => {
        console.error(
          "Party room error:",
          {
            code,
            message,
          }
        );
      }
    );

    console.log("Joined party:", this.room.sessionId);

    this.setupPartyRoomListeners(engine, resources, scene);
    this.setupInventoryListeners();
    this.sendGetInventory();
  }

  async leaveParty(options: {
    engine: ex.Engine;
    resources: GameResources;
    scene: ex.Scene;
    localPlayer: Player;
  }): Promise<void> {
    const partyRoom = this.room;

    /*
     * Clear before leaving so a refresh cannot restore
     * a party the user deliberately left.
     */
    this.clearPartyReconnection();

    this.currentParty = {
      roomCode: null,
      leaderSessionId: null,
      members: [],
    };

    if (partyRoom) {
      await partyRoom.leave(true);
    }

    if (this.room === partyRoom) {
      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;
    }

    this.clearRemotePlayers();

    await this.joinHub({
      engine: options.engine,
      resources: options.resources,
      scene: options.scene,
      localPlayer: options.localPlayer,
    });
  }

  async createParty(options: {
    engine: ex.Engine;
    resources: GameResources;
    scene: ex.Scene;
    username: string;
    localPlayer: Player;
  }): Promise<void> {
    const {
      engine,
      resources,
      scene,
      username,
    } = options;

    const supabase =
      createClient();

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "You are not logged in."
      );
    }

    if (this.room) {
      await this.room.leave(true);
    }

    this.clearRemotePlayers();

    const room =
      await this.client.create(
        "party_room",
        {
          accessToken:
            session.access_token,

          username,

          spawnX:
            options.localPlayer.pos.x,

          spawnY:
            options.localPlayer.pos.y,
        }
      );

    console.log(
      "CREATE PARTY RESULT:",
      {
        name:
          room.name,
        roomId:
          room.roomId,
        sessionId:
          room.sessionId,
      }
    )

    this.room = room;
    this.currentRoomKind =
      "party";

    this.callbacks =
      Callbacks.get(room);

    this.savePartyReconnection(room);

    this.setupPartyLeaveHandler(room);

    this.setupPartyRoomListeners(
      options.engine,
      options.resources,
      options.scene,
      options.localPlayer
    );

    this.setupInventoryListeners();
    this.sendGetInventory();

    console.log(
      "Created party:",
      room.roomId
    );
  }

  async joinPartyByCode(
    roomCode: string,
    options: {
      engine: ex.Engine;
      resources: GameResources;
      scene: ex.Scene;
      username: string;
      localPlayer: Player;
    }
  ): Promise<void> {
    const normalizedCode =
      roomCode
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      throw new Error(
        "Enter a party code."
      );
    }

    const supabase =
      createClient();

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "You are not logged in."
      );
    }

    if (this.room) {
      await this.room.leave(true);
    }

    this.clearRemotePlayers();

    try {
      const room = await this.client.joinById(normalizedCode, {
        accessToken: session.access_token,
        username: options.username,
        spawnX: options.localPlayer.pos.x,
        spawnY: options.localPlayer.pos.y,
      });

      this.room = room;
      this.currentRoomKind = "party";
      this.callbacks = Callbacks.get(room);

      this.savePartyReconnection(room);

      this.setupPartyLeaveHandler(room);

      this.setupPartyRoomListeners(
        options.engine,
        options.resources,
        options.scene,
        options.localPlayer
      );

      this.setupInventoryListeners();
      this.sendGetInventory();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message.toLowerCase()
          : "";

      if (message.includes("full")) {
        throw new Error("That party is full.");
      }

      throw new Error("Incorrect party code.");
    }
  }

  private currentParty: PartyData = {
    roomCode: null,
    leaderSessionId: null,
    members: [],
  };

  getCurrentParty(): PartyData {
    return {
      ...this.currentParty,
      members: [...this.currentParty.members],
    };
  }

  async reconnectToParty(options: {
    engine: ex.Engine;
    resources: GameResources;
    scene: ex.Scene;
    localPlayer: Player;
  }): Promise<boolean> {
    const reconnectionToken = sessionStorage.getItem(
      "moncra-party-reconnection-token"
    );

    if (!reconnectionToken) {
      return false;
    }

    try {
      const room = await this.client.reconnect(
        reconnectionToken
      );

      this.room = room;
      this.currentRoomKind = "party";
      this.callbacks = Callbacks.get(room);

      /*
       * The successful reconnection produces a new token.
       */
      this.savePartyReconnection(room);

      this.setupPartyLeaveHandler(room);

      this.setupPartyRoomListeners(
        options.engine,
        options.resources,
        options.scene,
        options.localPlayer
      );

      this.setupInventoryListeners();
      this.sendGetInventory();

      console.log("Reconnected to PartyRoom:", {
        roomId: room.roomId,
        sessionId: room.sessionId,
      });

      return true;
    } catch (error) {
      console.warn(
        "Could not reconnect to the previous PartyRoom:",
        error
      );

      this.clearPartyReconnection();

      return false;
    }
  }

  private clearPartyReconnection(): void {
    sessionStorage.removeItem(
      "moncra-party-reconnection-token"
    );

    sessionStorage.removeItem(
      "moncra-party-room-code"
    );
  }

  private savePartyReconnection(room: Room): void {
    sessionStorage.setItem(
      "moncra-party-reconnection-token",
      room.reconnectionToken
    );

    sessionStorage.setItem(
      "moncra-party-room-code",
      room.roomId
    );
  }

  private setupPartyRoomListeners(
    engine: ex.Engine,
    resources: GameResources,
    scene: ex.Scene,
    localPlayer: Player
  ): void {
    if (
      !this.room ||
      !this.callbacks
    ) {
      return;
    }

    const room =
      this.room;

    const callbacks =
      this.callbacks;

    const addRemotePlayer = (
      player: any,
      sessionId: string
    ): void => {
      if (
        sessionId === room.sessionId
      ) {
        this.setupLocalPlayerCallbacks(
          player
        );

        /*
         * Ensure the persistent client actor matches the
         * PartyRoom server state.
         */
        localPlayer.pos = ex.vec(
          player.x,
          player.y
        );

        callbacks.onChange(
          player,
          () => {
            localPlayer
              .reconcileServerPosition?.(
                player.x,
                player.y
              );
          }
        );

        return;
      }

      if (
        this.remotePlayers.has(
          sessionId
        )
      ) {
        return;
      }

      const remotePlayer =
        new RemotePlayer(
          ex.vec(
            player.x,
            player.y
          ),
          resources
        );

      scene.add(
        remotePlayer
      );

      this.remotePlayers.set(
        sessionId,
        remotePlayer
      );

      remotePlayer.updateFromNetwork(
        player,
        engine
      );

      callbacks.onChange(
        player,
        () => {
          remotePlayer.updateFromNetwork(
            player,
            engine
          );
        }
      );
    };

    callbacks.onAdd(
      "players",
      addRemotePlayer
    );

    callbacks.onRemove(
      "players",
      (
        _player: any,
        sessionId: string
      ) => {
        const remotePlayer =
          this.remotePlayers.get(
            sessionId
          );

        if (!remotePlayer) {
          return;
        }

        remotePlayer.kill();

        this.remotePlayers.delete(
          sessionId
        );
      }
    );

    room.onMessage(
      "weapon_attack",
      (data: any) => {
        console.log(
          "PARTY RECEIVED WEAPON ATTACK:",
          data
        );

        if (
          data.sessionId ===
          room.sessionId
        ) {
          this.localWeapon
            ?.confirmServerAttack?.(
              data
            );

          return;
        }

        const remotePlayer =
          this.remotePlayers.get(
            data.sessionId
          );

        if (!remotePlayer) {
          console.warn(
            "No remote player for party attack:",
            data.sessionId
          );

          return;
        }

        remotePlayer.playWeaponAttack(
          data
        );
      }
    );

    room.onMessage(
      "weapon_attack_start",
      (data: any) => {
        if (
          data.sessionId ===
          room.sessionId
        ) {
          return;
        }

        const remotePlayer =
          this.remotePlayers.get(
            data.sessionId
          );

        remotePlayer
          ?.playWeaponAttackStart(
            data
          );
      }
    );

    room.onMessage(
      "weapon_attack_release",
      (data: any) => {
        if (
          data.sessionId ===
          room.sessionId
        ) {
          return;
        }

        const remotePlayer =
          this.remotePlayers.get(
            data.sessionId
          );

        remotePlayer
          ?.playWeaponAttackRelease(
            data
          );
      }
    );

    room.onMessage("party_updated", (data: PartyData) => {
      this.currentParty = {
        roomCode: data.roomCode,
        leaderSessionId: data.leaderSessionId ?? null,
        members: data.members ?? [],
      };

      window.dispatchEvent(
        new CustomEvent("party_updated", {
          detail: this.currentParty,
        })
      );
    });
  }

  private setupPartyLeaveHandler(room: Room): void {
    room.onDrop((code, reason) => {
      console.warn("Party connection dropped:", {
        code,
        reason,
      });

      window.dispatchEvent(
        new CustomEvent("party_connection_status", {
          detail: {
            reconnecting: true,
          },
        })
      );
    });

    room.onReconnect(() => {
      console.log("Party connection restored.");

      this.savePartyReconnection(room);

      window.dispatchEvent(
        new CustomEvent("party_connection_status", {
          detail: {
            reconnecting: false,
          },
        })
      );
    });

    room.onLeave((code) => {
      console.log("Permanently left PartyRoom:", code);

      if (this.room !== room) {
        return;
      }

      this.clearPartyReconnection();
      this.clearRemotePlayers();

      this.room = null;
      this.callbacks = null;
      this.currentRoomKind = null;

      this.currentParty = {
        roomCode: null,
        leaderSessionId: null,
        members: [],
      };

      window.dispatchEvent(
        new CustomEvent("party_updated", {
          detail: this.currentParty,
        })
      );
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
    attackType: "normal" | "heavy";
  }) {
    if (!this.room) return;
    if (!this.canUseCombatMessages()) return;

    console.log("SENDING WEAPON ATTACK:", data);

    this.room.send("weapon_attack", data);
  }

  private dispatchPlayerStats(player: PlayerState) {
    window.dispatchEvent(
      new CustomEvent("player_stats_updated", {
        detail: {
          hp: player.hp,
          maxHp: player.maxHp,
          damage: player.damage,
          armor: player.armor,
          crit: player.crit,
          power: player.power,
          level: player.level,
          currentXp: player.currentXp,
          xpToNextLvl: player.xpToNextLvl,
        },
      })
    );
  }

  private setupLocalPlayerCallbacks(player: PlayerState) {
    if (!this.callbacks) return;

    const dispatchPlayerStats = () => {
      this.dispatchPlayerStats(player);
    };

    this.callbacks.listen(player, "hp", dispatchPlayerStats);
    this.callbacks.listen(player, "maxHp", dispatchPlayerStats);
    this.callbacks.listen(player, "damage", dispatchPlayerStats);
    this.callbacks.listen(player, "armor", dispatchPlayerStats);
    this.callbacks.listen(player, "crit", dispatchPlayerStats);
    this.callbacks.listen(player, "power", dispatchPlayerStats);
    this.callbacks.listen(player, "level", dispatchPlayerStats);
    this.callbacks.listen(player, "currentXp", dispatchPlayerStats);
    this.callbacks.listen(player, "xpToNextLvl", dispatchPlayerStats);

    console.log(player.currentXp)

    // Initial update
    dispatchPlayerStats();
  }

  public refreshLocalPlayerStats() {
    const player =
      this.room?.state.players.get(
        this.room.sessionId
      );

    if (!player) return;

    this.dispatchPlayerStats(player);
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
    serverAttackId: number;
    enemyId: string;
    hitT: number;
    aimAngle: number | null;
    attackType: "normal" | "heavy";
  }) {
    if (!this.room) return;

    if (
      this.currentRoomKind !== "dungeon"
    ) {
      return;
    }

    if (data.aimAngle === null) {
      return;
    }

    this.room.send(
      "sword_hit",
      data
    );
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

  sendDismantleItem(
    uid: string
  ): void {
    if (!this.room) {
      console.warn(
        "Cannot dismantle without a room."
      );

      return;
    }

    console.log(
      "SENDING DISMANTLE:",
      uid
    );

    this.room.send(
      "dismantle_item",
      {
        uid,
      }
    );
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
      isLarge: enemyState.isLarge,
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
        isLarge: enemyState.isLarge,
        state: enemyState.state,
      },
      this.dungeonResources,
      enemyState.isLarge ? 3.5 : 2.5,
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
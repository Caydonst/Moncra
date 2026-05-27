import * as ex from "excalibur";
import { Client, Room, Callbacks } from "@colyseus/sdk";
import { GameState, PlayerState } from "../../../server/src/schemas/GameState"
import { GameResources } from "../resources";
import { RemotePlayer } from "../network/RemotePlayer";

class MultiplayerManager {
  client = new Client("ws://localhost:2567");
  room: Room | null = null;
  callbacks = null;

  remotePlayers = new Map<string, RemotePlayer>();

  async connect(engine: ex.Engine, resources: GameResources) {
    try {
      this.room = await this.client.joinOrCreate("hub_room");
      this.callbacks = Callbacks.get(this.room);

      console.log("Joined room:", this.room.sessionId);

      this.setupRemotePlayers(engine, resources);

      // Ask for existing players AFTER listener is registered
      this.room.send("get_existing_players");
    } catch (err) {
      console.error("Failed to join Colyseus room:", err);
    }
  }

  setupRemotePlayers(engine: ex.Engine, resources: GameResources) {
    if (!this.room || !this.callbacks) return;

    const addRemotePlayer = (player: any, sessionId: string) => {
      if (sessionId === this.room?.sessionId) return;
      if (this.remotePlayers.has(sessionId)) return;

      const remotePlayer = new RemotePlayer(
        ex.vec(player.x, player.y),
        resources,
      );

      engine.currentScene.add(remotePlayer);
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

    this.room.onMessage("weapon_attack", (data: any) => {
      if (data.sessionId === this.room?.sessionId) return;

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
      addRemotePlayer(player, sessionId);
    });

    this.callbacks.onRemove("players", (_player: any, sessionId: string) => {
      const remotePlayer = this.remotePlayers.get(sessionId);
    if (!remotePlayer) return;

    engine.currentScene.remove(remotePlayer);
      this.remotePlayers.delete(sessionId);
    });
  }

    sendPlayerMove(data: {
        x: number;
        y: number;
        rotation: number;
        weaponId?: string;
        aimAngle?: number;
        isAttacking?: boolean;
        attackId?: number
    }) {
        if (!this.room) return;

        this.room.send("player_move", data);
    }
    sendWeaponAttack(data: {
      weaponId: string;
      x: number;
      y: number;
      aimAngle: number;
    }) {
      if (!this.room) return;

      this.room.send("weapon_attack", data);
    }
    sendWeaponAttackStart(data: any) {
      if (!this.room) return;
      this.room.send("weapon_attack_start", data);
    }

    sendWeaponAttackRelease(data: any) {
      if (!this.room) return;
      this.room.send("weapon_attack_release", data);
    }
}

export const multiplayer = new MultiplayerManager();
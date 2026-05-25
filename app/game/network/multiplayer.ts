import * as ex from "excalibur";
import { Client, Room, Callbacks } from "@colyseus/sdk";
import { GameState, PlayerState } from "../../../server/src/schemas/GameState"

class MultiplayerManager {
  client = new Client("ws://localhost:2567");
  room: Room | null = null;
  callbacks = null;

  remotePlayers = new Map<string, ex.Actor>();

  async connect(engine: ex.Engine) {
    try {
      this.room = await this.client.joinOrCreate("hub_room");
      console.log(this.room)
      this.callbacks = Callbacks.get(this.room);

      console.log(this.callbacks)

      console.log("Joined room:", this.room.sessionId);

      this.setupRemotePlayers(engine);

    } catch (err) {
      console.error("Failed to join Colyseus room:", err);
    }
  }

    setupRemotePlayers(engine: ex.Engine) {
  if (!this.room || !this.callbacks) return;

  const addRemotePlayer = (player: any, sessionId: string) => {
    if (sessionId === this.room?.sessionId) return;
    if (this.remotePlayers.has(sessionId)) return;

    const remotePlayer = new ex.Actor({
      pos: ex.vec(player.x, player.y),
      width: 32,
      height: 32,
      color: ex.Color.Blue,
    });

    engine.currentScene.add(remotePlayer);
    this.remotePlayers.set(sessionId, remotePlayer);

    this.callbacks!.onChange(player, () => {
      remotePlayer.pos = ex.vec(player.x, player.y);
      remotePlayer.rotation = player.rotation;
    });
  };

  this.room.onMessage("existing_players", (data: any) => {
    console.log(data);
    data.players.forEach((p: any) => {
      addRemotePlayer(p, p.sessionId);
    });
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
    }) {
        if (!this.room) return;

        this.room.send("player_move", data);
    }
}

export const multiplayer = new MultiplayerManager();
import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState, PlayerState } from "../schemas/GameState.js";

type PlayerInput = {
  x: number;
  y: number;
  rotation: number;
  weaponId?: string;
};

export class HubRoom extends Room<GameState> {
  maxClients = 4;
  state = new GameState();

  onCreate() {

    this.onMessage("player_move", (client, data: PlayerInput) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.x = data.x;
      player.y = data.y;
      player.rotation = data.rotation;

      if (data.weaponId) {
        player.weaponId = data.weaponId;
      }
    });

    this.onMessage("attack", (client, data) => {
      this.broadcast("player_attack", {
        sessionId: client.sessionId,
        ...data,
      });
    });

    this.onMessage("get_existing_players", (client) => {
        client.send("existing_players", {
            players: Array.from(this.state.players.entries()).map(([sessionId, p]) => ({
            sessionId,
            x: p.x,
            y: p.y,
            rotation: p.rotation,
            hp: p.hp,
            weaponId: p.weaponId,
            })),
        });
    });
  }

  onJoin(client: Client) {
    const player = new PlayerState();

    player.x = 300;
    player.y = 300;
    player.hp = 100;

    this.state.players.set(client.sessionId, player);

    client.send("existing_players", {
        players: Array.from(this.state.players.entries()).map(([sessionId, p]) => ({
            sessionId,
            x: p.x,
            y: p.y,
            rotation: p.rotation,
            hp: p.hp,
            weaponId: p.weaponId,
        })),
    });

    console.log(`${client.sessionId} joined`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);

    console.log(`${client.sessionId} left`);
  }
}
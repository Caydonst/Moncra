import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState, PlayerState } from "../schemas/GameState.js";

type PlayerInput = {
  x: number;
  y: number;
  rotation: number;
  weaponId?: string;

  aimAngle?: number;
  isAttacking?: boolean;
  attackId?: number;
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

    player.aimAngle = data.aimAngle ?? player.aimAngle;
    player.isAttacking = data.isAttacking ?? false;
    player.attackId = data.attackId ?? player.attackId;

    if (data.weaponId) {
      player.weaponId = data.weaponId;
    }
    // Server
    console.log("server attackId", data.attackId);
  });

    this.onMessage("weapon_attack", (client, data) => {
      this.broadcast("weapon_attack", {
        sessionId: client.sessionId,
        ...data,
      });
    });

    this.onMessage("weapon_attack_start", (client, data) => {
      this.broadcast("weapon_attack_start", {
        sessionId: client.sessionId,
        ...data,
      });
    });

    this.onMessage("weapon_attack_release", (client, data) => {
      this.broadcast("weapon_attack_release", {
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
              aimAngle: p.aimAngle,
              isAttacking: p.isAttacking,
              attackId: p.attackId,
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

    console.log(`${client.sessionId} joined`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);

    console.log(`${client.sessionId} left`);
  }
}
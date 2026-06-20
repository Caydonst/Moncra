import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState, PlayerState } from "../schemas/GameState.js";

type PlayerInput = {
  x: number;
  y: number;
  rotation: number;
  weapon?: {
    id?: number;
    icon?: string;
    damage?: number;
  };

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

    if (data.weapon) {
      player.weapon.id = data.weapon.id ?? 0;
      player.weapon.icon = data.weapon.icon ?? "";
      player.weapon.damage = data.weapon.damage ?? 0;
    } else {
      player.weapon.id = "";
      player.weapon.icon = "";
      player.weapon.damage = 0;
    }
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
              weapon: p.weapon,
              aimAngle: p.aimAngle,
              isAttacking: p.isAttacking,
              attackId: p.attackId,
            })),
        });
    });

    this.onMessage("sentinel_guard_toggle", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.guardStance = !player.guardStance;
    });

    this.onMessage("sentinel_block_start", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.isBlocking = true;
    });

    this.onMessage("sentinel_block_end", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.isBlocking = false;
    });

    this.onMessage("sentinel_charge_start", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      console.log("charge start received", {
          resolve: player.resolve,
          isBlocking: player.isBlocking,
          isCharging: player.isCharging,
      });

      if (player.resolve <= 0) return;
      if (player.isBlocking) return;
      if (player.isCharging) return;

      player.isCharging = true;
      player.chargeResolveUsed = 0;

      console.log("charge started");
    });

    this.onMessage("sentinel_charge_release", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (!player.isCharging) return;

      player.isCharging = false;

      const chargeResolveUsed = player.chargeResolveUsed;
      player.chargeResolveUsed = 0;

      this.broadcast("sentinel_charge_attack", {
        sessionId: client.sessionId,
        aimAngle: data.aimAngle,
        chargeResolveUsed,
      });
    });

    this.onMessage("sentinel_successful_hit", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      console.log("before hit resolve:", player.resolve);

      gainResolve(
          player,
          player.guardStance
              ? SENTINEL.guardHitResolve
              : SENTINEL.normalHitResolve
      );

      console.log("after hit resolve:", player.resolve);
  });

    this.onMessage("sentinel_blocked_attack", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const perfectBlock = !!data.perfectBlock;

      if (perfectBlock) {
        gainResolve(
          player,
          player.guardStance
            ? SENTINEL.guardPerfectBlockResolve
            : SENTINEL.normalPerfectBlockResolve
        );
      } else {
        gainResolve(
          player,
          player.guardStance
            ? SENTINEL.guardBlockResolve
            : SENTINEL.normalBlockResolve
        );
      }
    });

    this.setSimulationInterval((deltaTime) => {
      this.state.players.forEach((player) => {
          if (player.isCharging) {
              console.log("charging tick", player.resolve);

              const spend = SENTINEL.resolvePerSecondCharge * (deltaTime / 1000);
              const actualSpend = Math.min(player.resolve, spend);

              player.resolve -= actualSpend;
              player.chargeResolveUsed += actualSpend;

              if (player.resolve <= 0) {
                  player.resolve = 0;
                  player.isCharging = false;
              }
          }
      });
    });
  }

  onJoin(client: Client) {
    const player = new PlayerState();

    player.x = 300;
    player.y = 300;
    player.hp = 100;

    player.lastResolveGainTime = Date.now();

    this.state.players.set(client.sessionId, player);

    console.log(`${client.sessionId} joined`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);

    console.log(`${client.sessionId} left`);
  }
}

const SENTINEL = {
  maxResolve: 100,
  decayDelayMs: 10_000,
  decayPerSecond: 3,
  resolvePerSecondCharge: 50,
  normalHitResolve: 1,
  guardHitResolve: 2,
  normalBlockResolve: 2,
  guardBlockResolve: 4,
  normalPerfectBlockResolve: 10,
  guardPerfectBlockResolve: 20,
};

function gainResolve(player: PlayerState, amount: number) {
    player.resolve = Math.min(player.maxResolve, player.resolve + amount);
    player.lastResolveGainTime = Date.now();

    console.log("reset decay timer:", player.lastResolveGainTime);
}
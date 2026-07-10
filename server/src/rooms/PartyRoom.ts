import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
import { deleteInventoryForSession } from "../game_systems/inventory/testInventoryStore.js";

export class PartyRoom extends Room<GameState> {
  maxClients = 4;
  patchRate = 20;
  state = new GameState();

  onCreate() {
    registerPlayerMessages(this);
    registerInventoryMessages(this);

    this.setSimulationInterval((deltaTime) => {
      runPlayerMovement(this.state.players, deltaTime);
    });
  }

  onJoin(client: Client) {
    const player = spawnPlayer(400, 400);
    this.state.players.set(client.sessionId, player);

    player.weapon.id = "great_sword1";
    player.weapon.damage = 10;
    player.weapon.icon = "great_sword1";

      console.log(`${client.sessionId} joined party`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);

    console.log(`${client.sessionId} left party`);
    //this.state.players.delete(client.sessionId);
    //deleteInventoryForSession(client.sessionId);
  }
}
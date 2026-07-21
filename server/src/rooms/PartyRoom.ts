import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
import { deleteInventoryForSession, getInventoryForSession } from "../game_systems/inventory/testInventoryStore.js";
import { verifySupabaseToken } from "../auth/verifySupabaseToken.js";
import {
  getActivePlayer,
  removeActivePlayer,
  setActivePlayer,
} from "../auth/activePlayers.js";

type ClientAuth = {
  userId: string;
  email?: string;
};

export class PartyRoom extends Room<{ state: GameState }> {
  maxClients = 4;
  patchRate = 20;
  state = new GameState();

  private userIds = new Map<string, string>();

  onCreate() {
    registerPlayerMessages(this);
    registerInventoryMessages(this);

    this.setSimulationInterval((deltaTime) => {
      runPlayerMovement(this.state.players, deltaTime);
    });
  }

  onJoin(
      client: Client,
      options: unknown
    ) {
      const auth =
        client.auth as ClientAuth | undefined;
  
      if (!auth?.userId) {
        throw new Error(
          "Authenticated user ID was not attached to the client."
        );
      }
  
      const previousConnection =
        getActivePlayer(auth.userId);
  
      if (
        previousConnection &&
        previousConnection.client.sessionId !==
        client.sessionId
      ) {
        previousConnection.client.send(
          "account_logged_in_elsewhere",
          {
            message:
              "This account was logged in from another device.",
          }
        );
  
        previousConnection.client.leave(4001);
      }
  
      setActivePlayer(auth.userId, {
        client,
        roomId: this.roomId,
      });
  
      console.log(
        "client.auth in onJoin:",
        client.auth
      );
  
      this.userIds.set(
        client.sessionId,
        auth.userId
      );
  
      const player = spawnPlayer(400, 400);
  
      this.state.players.set(
        client.sessionId,
        player
      );
  
      const inventory = getInventoryForSession(auth.userId, player);
              
      if (inventory.weapon) {
          player.weapon.id = inventory.weapon.itemId;
          player.weapon.damage = inventory.weapon.upgradedStats.damage.value;
          //player.weapon.icon = inventory.weapon.icon;
      }
  
      console.log(
        `${client.sessionId} ${auth.userId} joined hub`
      );
    }
  
  getUserId(client: Client): string {
    const userId = this.userIds.get(
      client.sessionId
    );

    if (!userId) {
      throw new Error(
        "Authenticated user ID was not found."
      );
    }

    return userId;
  }

  onLeave(client: Client) {
    const userId = client.userData?.userId;

    if (userId) {
      removeActivePlayer(
        userId,
        client.sessionId
      );
    }

    this.state.players.delete(client.sessionId);

    this.userIds.delete(
      client.sessionId
    );

    console.log(
      `${client.sessionId} left hub`
    );
  }
}
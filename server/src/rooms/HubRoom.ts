import { Room, CloseCode } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
import {
  getInventoryForUser
} from "../game_systems/inventory/testInventoryStore.js";
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

const ROOM_CODE_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ROOM_CODE_LENGTH = 6;
const HUB_CODE_REGISTRY = "$moncra_hub_codes";

export class HubRoom extends Room<{ state: GameState }> {
  maxClients = 4;
  patchRate = 20;
  state = new GameState();

  private userIds = new Map<string, string>();

  async onAuth(
    client: Client,
    options: {
      accessToken?: string;
    }
  ): Promise<ClientAuth> {
    if (!options.accessToken) {
      throw new Error(
        "Missing authentication token."
      );
    }

    const user = await verifySupabaseToken(
      options.accessToken
    );

    if (!user?.id) {
      throw new Error(
        "Invalid Supabase authentication token."
      );
    }

    return {
      userId: user.id,
      email: user.email,
    };
  }

  async onCreate(): Promise<void> {
    this.roomId =
      await this.generateUniqueRoomCode();

    console.log(
      `Created hub room with code: ${this.roomId}`
    );

    registerPlayerMessages(this);
    registerInventoryMessages(this);

    this.setSimulationInterval(
      deltaTime => {
        runPlayerMovement(
          this.state.players,
          deltaTime
        );
      }
    );

    /*
     * Let the room disappear when nobody remains.
     * Otherwise old room codes will remain forever.
     */
    this.autoDispose = true;
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

    const ACCOUNT_LOGGED_IN_ELSEWHERE = 4101;

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

      previousConnection.client.leave(
        ACCOUNT_LOGGED_IN_ELSEWHERE
      );
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

    const inventory = getInventoryForUser(auth.userId, player);
            
    if (inventory.weapon) {
        player.weapon.id = inventory.weapon.itemId;
        player.weapon.damage = inventory.weapon.upgradedStats.damage.value;
        //player.weapon.icon = inventory.weapon.icon;
    }

    console.log(
      `${client.sessionId} ${auth.userId} joined hub`
    );
  }

  async onDrop(client: Client, code?: number) {
    console.warn("Player connection dropped:", {
      sessionId: client.sessionId,
      code,
    });

    const player = this.state.players.get(client.sessionId);

    if (player) {
      player.connected = false;
    }

    try {
      // Keep the player's seat reserved for 30 seconds.
      await this.allowReconnection(client, 30);

      console.log("Player reconnection accepted:", client.sessionId);
    } catch (error) {
      console.warn("Player failed to reconnect:", {
        sessionId: client.sessionId,
        error,
      });
    }
  }

  onReconnect(client: Client) {
    console.log("Player reconnected:", client.sessionId);

    const player = this.state.players.get(client.sessionId);

    if (player) {
      player.connected = true;
    }
  }

  onLeave(client: Client) {
    const userId =
      this.userIds.get(
        client.sessionId
      );

    if (userId) {
      removeActivePlayer(
        userId,
        client.sessionId
      );
    }

    this.state.players.delete(
      client.sessionId
    );

    this.userIds.delete(
      client.sessionId
    );

    /*
     * Do not delete the user's inventory.
     * It must survive room changes.
     */

    console.log(
      `${client.sessionId} ${userId ?? "unknown-user"} left hub`
    );
  }

  async onDispose(): Promise<void> {
    await this.presence.srem(
      HUB_CODE_REGISTRY,
      this.roomId
    );

    console.log(
      `Disposed hub room: ${this.roomId}`
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

  private generateRoomCodeCandidate(): string {
    let code = "";

    for (
      let index = 0;
      index < ROOM_CODE_LENGTH;
      index++
    ) {
      const randomIndex = Math.floor(
        Math.random() *
        ROOM_CODE_CHARACTERS.length
      );

      code +=
        ROOM_CODE_CHARACTERS[
        randomIndex
        ];
    }

    return code;
  }

  private async generateUniqueRoomCode(): Promise<string> {
    const existingCodes =
      await this.presence.smembers(
        HUB_CODE_REGISTRY
      );

    let code: string;

    do {
      code =
        this.generateRoomCodeCandidate();
    } while (
      existingCodes.includes(code)
    );

    await this.presence.sadd(
      HUB_CODE_REGISTRY,
      code
    );

    return code;
  }
}
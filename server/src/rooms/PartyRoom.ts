import { Room, CloseCode } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
import {
  applyInventoryStatsToPlayer,
  getInventoryForUser
} from "../game_systems/inventory/testInventoryStore.js";
import { verifySupabaseToken } from "../auth/verifySupabaseToken.js";

import {
  registerPlayerCombatMessages,
} from "../game_systems/registerCombatMessages.js";

type ClientAuth = {
  userId: string;
  email?: string;
};

type PartyMemberInfo = {
  userId: string;
  username: string;
  isLeader: boolean;
  isReady: boolean;
};

const PARTY_CODE_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const PARTY_CODE_LENGTH = 6;

function generatePartyCode(): string {
  let code = "";

  for (
    let index = 0;
    index < PARTY_CODE_LENGTH;
    index++
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        PARTY_CODE_CHARACTERS.length
      );

    code +=
      PARTY_CODE_CHARACTERS[
      randomIndex
      ];
  }

  return code;
}

export class PartyRoom extends Room<{
  state: GameState;
}> {
  maxClients = 4;
  patchRate = 20;

  state = new GameState();

  private userIds =
    new Map<string, string>();

  private partyMembers =
    new Map<string, PartyMemberInfo>();

  private leaderSessionId:
    string | null = null;

  async onAuth(
    _client: Client,
    options: {
      accessToken?: string;
    }
  ): Promise<ClientAuth> {
    if (!options.accessToken) {
      throw new Error(
        "Missing authentication token."
      );
    }

    const user =
      await verifySupabaseToken(
        options.accessToken
      );

    if (!user?.id) {
      throw new Error(
        "Invalid authentication token."
      );
    }

    return {
      userId: user.id,
      email: user.email,
    };
  }

  onCreate(): void {
    console.log(
      "PARTY ROOM onCreate fired"
    );

    this.roomId =
      generatePartyCode();

    console.log(
      "Created party room:",
      this.roomId
    );

    registerPlayerMessages(this);
    registerInventoryMessages(this);
    registerPlayerCombatMessages(this);

    this.setSimulationInterval(
      deltaTime => {
        runPlayerMovement(
          this.state.players,
          deltaTime
        );
      }
    );

    this.onMessage(
      "party_set_ready",
      (
        client,
        message: {
          ready: boolean;
        }
      ) => {
        const member =
          this.partyMembers.get(
            client.sessionId
          );

        if (!member) return;

        member.isReady =
          Boolean(message.ready);

        this.broadcastPartyState();
      }
    );

    this.autoDispose = true;
  }

  onJoin(
    client: Client,
    options: {
      username?: string;
      spawnX?: number;
      spawnY?: number;
    }
  ): void {

    console.log(
      "PARTY ROOM onJoin fired:",
      {
        sessionId:
          client.sessionId,
        roomId:
          this.roomId,
        auth:
          client.auth,
      }
    );
    
    const auth =
      client.auth as
      | ClientAuth
      | undefined;

    if (!auth?.userId) {
      throw new Error(
        "Missing authenticated user."
      );
    }

    this.userIds.set(
      client.sessionId,
      auth.userId
    );

    const spawnX =
      Number.isFinite(options.spawnX)
        ? options.spawnX!
        : 400;

    const spawnY =
      Number.isFinite(options.spawnY)
        ? options.spawnY!
        : 400;

    const player =
      spawnPlayer(
        spawnX,
        spawnY
      );

    player.username = options.username;

    const inventory =
      getInventoryForUser(
        auth.userId,
        player
      );

    applyInventoryStatsToPlayer(
      player,
      inventory
    );

    if (inventory.weapon) {
      player.weapon.id =
        inventory.weapon.itemId;

      player.weapon.damage =
        inventory.weapon
          .upgradedStats
          .damage
          .value;
    }

    this.state.players.set(
      client.sessionId,
      player
    );

    const isLeader =
      this.leaderSessionId === null;

    if (isLeader) {
      this.leaderSessionId =
        client.sessionId;
    }

    this.partyMembers.set(
      client.sessionId,
      {
        userId:
          auth.userId,

        username:
          options.username ??
          auth.email ??
          "Player",

        isLeader,

        isReady:
          false,
      }
    );

    this.broadcastPartyState();
  }

  onDrop(client: Client, code?: number): void {
    console.warn("Party player connection dropped:", {
      sessionId: client.sessionId,
      roomId: this.roomId,
      code,
    });

    const player = this.state.players.get(client.sessionId);

    if (player) {
      player.connected = false;
      player.moveX = 0;
      player.moveY = 0;
    }

    /*
     * Reserve this player's seat for 30 seconds.
     *
     * Do not await this here unless you specifically want
     * onDrop() to stay pending for the entire timeout.
     */
    void this.allowReconnection(client, 30);
  }

  onReconnect(client: Client): void {
    console.log("Party player reconnected:", {
      sessionId: client.sessionId,
      roomId: this.roomId,
    });

    const player = this.state.players.get(client.sessionId);

    if (player) {
      player.connected = true;
    }

    this.broadcastPartyState();
  }

  onLeave(client: Client): void {
    const wasLeader =
      this.leaderSessionId ===
      client.sessionId;

    this.state.players.delete(
      client.sessionId
    );

    this.userIds.delete(
      client.sessionId
    );

    this.partyMembers.delete(
      client.sessionId
    );

    if (wasLeader) {
      const nextSessionId =
        this.partyMembers.keys()
          .next()
          .value as
        | string
        | undefined;

      this.leaderSessionId =
        nextSessionId ?? null;

      if (nextSessionId) {
        const nextLeader =
          this.partyMembers.get(
            nextSessionId
          );

        if (nextLeader) {
          nextLeader.isLeader =
            true;
        }
      }
    }

    this.broadcastPartyState();
  }

  getUserId(
    client: Client
  ): string {
    const userId =
      this.userIds.get(
        client.sessionId
      );

    if (!userId) {
      throw new Error(
        "Authenticated user ID was not found."
      );
    }

    return userId;
  }

  private broadcastPartyState(): void {
    this.broadcast(
      "party_updated",
      {
        roomCode:
          this.roomId,

        leaderSessionId:
          this.leaderSessionId,

        members:
          Array.from(
            this.partyMembers.entries()
          ).map(
            (
              [
                sessionId,
                member,
              ]
            ) => ({
              sessionId,
              ...member,
            })
          ),
      }
    );
  }
}
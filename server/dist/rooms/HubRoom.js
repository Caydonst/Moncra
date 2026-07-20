import { Room } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
import { getInventoryForSession } from "../game_systems/inventory/testInventoryStore.js";
import { verifySupabaseToken } from "../auth/verifySupabaseToken.js";
export class HubRoom extends Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
        this.patchRate = 20;
        this.state = new GameState();
        this.userIds = new Map();
    }
    async onAuth(client, options) {
        if (!options.accessToken) {
            throw new Error("Missing authentication token.");
        }
        const user = await verifySupabaseToken(options.accessToken);
        if (!user?.id) {
            throw new Error("Invalid Supabase authentication token.");
        }
        return {
            userId: user.id,
            email: user.email,
        };
    }
    onCreate() {
        registerPlayerMessages(this);
        registerInventoryMessages(this);
        this.setSimulationInterval((deltaTime) => {
            runPlayerMovement(this.state.players, deltaTime);
        });
    }
    onJoin(client, options) {
        const auth = client.auth;
        if (!auth?.userId) {
            throw new Error("Authenticated user ID was not attached to the client.");
        }
        console.log("client.auth in onJoin:", client.auth);
        this.userIds.set(client.sessionId, auth.userId);
        const player = spawnPlayer(400, 400);
        this.state.players.set(client.sessionId, player);
        const inventory = getInventoryForSession(auth.userId, player);
        if (inventory.weapon) {
            player.weapon.id = inventory.weapon.itemId;
            player.weapon.damage = inventory.weapon.upgradedStats.damage.value;
            //player.weapon.icon = inventory.weapon.icon;
        }
        console.log(`${client.sessionId} ${auth.userId} joined hub`);
    }
    getUserId(client) {
        const userId = this.userIds.get(client.sessionId);
        if (!userId) {
            throw new Error("Authenticated user ID was not found.");
        }
        return userId;
    }
    onLeave(client) {
        this.state.players.delete(client.sessionId);
        this.userIds.delete(client.sessionId);
        console.log(`${client.sessionId} left hub`);
    }
}
//# sourceMappingURL=HubRoom.js.map
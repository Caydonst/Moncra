import { Room } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
export class PartyRoom extends Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
        this.patchRate = 20;
        this.state = new GameState();
    }
    onCreate() {
        registerPlayerMessages(this);
        registerInventoryMessages(this);
        this.setSimulationInterval((deltaTime) => {
            runPlayerMovement(this.state.players, deltaTime);
        });
    }
    onJoin(client) {
        const player = spawnPlayer(400, 400);
        this.state.players.set(client.sessionId, player);
        player.weapon.id = "great_sword1";
        player.weapon.damage = 10;
        player.weapon.icon = "great_sword1";
        console.log(`${client.sessionId} joined party`);
    }
    getUserId(client) {
        return client.auth?.userId ?? client.sessionId;
    }
    onLeave(client) {
        this.state.players.delete(client.sessionId);
        console.log(`${client.sessionId} left party`);
        //this.state.players.delete(client.sessionId);
        //deleteInventoryForSession(client.sessionId);
    }
}
//# sourceMappingURL=PartyRoom.js.map
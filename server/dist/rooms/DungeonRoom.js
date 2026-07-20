import { Room } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
import { registerPlayerMessages } from "../game_systems/registerPlayerMessages.js";
import { registerCombatMessages } from "../game_systems/registerCombatMessages.js";
import { runPlayerMovement } from "../game_systems/runPlayerMovement.js";
import { runEnemySimulation } from "../game_systems/runEnemySimulation.js";
import { spawnPlayer } from "../game_systems/spawnPlayer.js";
import { spawnDemon } from "../game_systems/spawnDemon.js";
import { generateDungeon } from "../shared/dungeon/dungeonGenerator.js";
import { registerDungeonMessages } from "../game_systems/registerDungeonMessages.js";
import { registerInventoryMessages } from "../game_systems/registerInventoryMessages.js";
import { clearEnemyContributors, getEnemyContributors } from "../game_systems/combat/enemyContributors.js";
import { getInventoryForSession } from "../game_systems/inventory/testInventoryStore.js";
import { addXpToEquippedGear } from "../game_systems/items/itemXp.js";
import { hydrateInventory } from "../game_systems/inventory/hydrateInventory.js";
import { verifySupabaseToken } from "../auth/verifySupabaseToken.js";
export class DungeonRoom extends Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
        this.patchRate = 1;
        this.state = new GameState();
        this.userIds = new Map();
        this.numFloors = 5;
        this.dungeon = generateDungeon(this.numFloors, 60, 60);
        this.enemyIdCounter = 0;
        this.currentFloor = 1;
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
        registerCombatMessages(this);
        registerDungeonMessages(this);
        registerInventoryMessages(this);
        this.onMessage("get_dungeon", (client) => {
            client.send("dungeon_data", {
                dungeon: this.dungeon,
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
        console.log(this.dungeon);
        this.setSimulationInterval((deltaTime) => {
            const floor = this.dungeon.floors[this.currentFloor];
            if (!floor)
                return;
            runPlayerMovement(this.state.players, deltaTime, floor.map);
            runEnemySimulation(this.state.enemies, this.state.players, deltaTime, floor.map, this.clock.currentTime);
        });
        this.loadFloorState(this.currentFloor);
    }
    onJoin(client) {
        const auth = client.auth;
        if (!auth?.userId) {
            throw new Error("Authenticated user ID was not attached to the client.");
        }
        console.log("client.auth in onJoin:", client.auth);
        this.userIds.set(client.sessionId, auth.userId);
        const spawn = this.dungeon.floors[1].playerSpawn;
        const player = spawnPlayer(spawn.x * 64 + 32, spawn.y * 64 + 32);
        const inventory = getInventoryForSession(auth.userId, player);
        if (inventory.weapon) {
            player.weapon.id = inventory.weapon.itemId;
            player.weapon.damage = inventory.weapon.upgradedStats.damage.value;
            //player.weapon.icon = inventory.weapon.icon;
        }
        this.state.players.set(client.sessionId, player);
        console.log(`${client.sessionId} joined dungeon`);
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
        console.log(`${client.sessionId} left dungeon`);
        //this.state.players.delete(client.sessionId);
        //deleteInventoryForSession(client.sessionId);
    }
    addDemon(x, y) {
        const enemy = spawnDemon(x, y);
        const id = `enemy_${this.enemyIdCounter++}`;
        this.state.enemies.set(id, enemy);
    }
    loadFloorState(floorIndex) {
        const floor = this.dungeon.floors[floorIndex];
        if (!floor)
            return;
        this.currentFloor = floorIndex;
        this.state.enemies.clear();
        //this.state.chests?.clear?.(); // only if you have chests in schema
        for (const enemyDef of floor.enemies) {
            const enemy = spawnDemon(enemyDef.x, enemyDef.y);
            enemy.type = enemyDef.type;
            enemy.hp = enemyDef.hp;
            enemy.maxHp = enemyDef.maxHp;
            enemy.state = "idle";
            this.state.enemies.set(enemyDef.id, enemy);
        }
        // If you add ChestState later:
        /*
        for (const chestDef of floor.chests) {
          const chest = new ChestState();
          chest.id = chestDef.id;
          chest.x = chestDef.x;
          chest.y = chestDef.y;
          chest.opened = chestDef.opened;
      
          this.state.chests.set(chestDef.id, chest);
        }
        */
    }
    awardEnemyExperience(enemyId, enemy) {
        const contributors = getEnemyContributors(enemyId);
        if (!contributors) {
            return;
        }
        const xpReward = this.getEnemyXpReward(enemy);
        for (const sessionId of contributors) {
            const player = this.state.players.get(sessionId);
            if (!player) {
                continue;
            }
            const client = this.clients.find(roomClient => roomClient.sessionId ===
                sessionId);
            const userId = this.getUserId(client);
            const inventory = getInventoryForSession(userId, player);
            addXpToEquippedGear(inventory, xpReward);
            client?.send("inventory_updated", {
                enemyId,
                xpGained: xpReward,
                inventory: hydrateInventory(inventory),
            });
            console.log("INVENTORY WEAPON AFTER XP GAIN: ", hydrateInventory(inventory).weapon);
        }
        clearEnemyContributors(enemyId);
    }
    getEnemyXpReward(enemy) {
        switch (enemy.type) {
            case "demon":
                return 25;
            case "demon_boss":
                return 250;
            default:
                return 10;
        }
    }
}
//# sourceMappingURL=DungeonRoom.js.map
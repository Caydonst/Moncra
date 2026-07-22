import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { EnemyState, GameState, PlayerState } from "../schemas/GameState.js";
import { generateDungeonFloor } from "../shared/dungeon/mapGenerator.js";

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
import {
    getActivePlayer,
    removeActivePlayer,
    setActivePlayer,
} from "../auth/activePlayers.js";
import { DungeonFloor, tileToWorld } from "../shared/dungeon/dungeonTypes.js";

type ClientAuth = {
    userId: string;
    email?: string;
};

export class DungeonRoom extends Room<{ state: GameState }> {
    maxClients = 4;
    patchRate = 1;
    state = new GameState();

    private userIds = new Map<string, string>();

    private numFloors = 5;
    public dungeon = generateDungeon(this.numFloors, 60, 60);
    private enemyIdCounter = 0;
    private loadedEnemyFloors = new Set<number>();

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

    onCreate() {
        registerPlayerMessages(this);
        registerCombatMessages(this);
        registerDungeonMessages(this);
        registerInventoryMessages(this);

        //this.loadAllFloorEnemies();

        this.onMessage("get_dungeon", (client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            client.send("dungeon_data", {
                dungeon: this.dungeon,
                currentFloor: player.currentFloor,
            });
        });

        this.onMessage("get_existing_players", (client) => {
            client.send("existing_players", {
                players: Array.from(this.state.players.entries()).map(([sessionId, player]) => ({
                    sessionId,
                    x: player.x,
                    y: player.y,
                    rotation: player.rotation,
                    hp: player.hp,
                    weapon: player.weapon,
                    aimAngle: player.aimAngle,
                    isAttacking: player.isAttacking,
                    attackId: player.attackId,
                    currentFloor: player.currentFloor,
                })),
            });
        });

        console.log(this.dungeon);

        this.setSimulationInterval(
            (deltaTime) => {
                runPlayerMovement(
                    this.state.players,
                    deltaTime,
                    (player) =>
                        this.getPlayerFloor(
                            player
                        )
                );

                runEnemySimulation(
                    this.state.enemies,
                    this.state.players,
                    deltaTime,
                    (floorNumber) =>
                        this.getFloor(
                            floorNumber
                        ),
                    this.clock.currentTime
                );
            }
        );
    }

    onJoin(client: Client) {
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

        const startingFloorNumber = 1;

        const startingFloor =
            this.dungeon.floors[
            startingFloorNumber
            ];

        if (!startingFloor) {
            throw new Error(
                `Starting floor ${startingFloorNumber} does not exist.`
            );
        }

        const spawnPosition = tileToWorld(
            startingFloor.playerSpawn.x,
            startingFloor.playerSpawn.y
        );

        const player = spawnPlayer(
            spawnPosition.x,
            spawnPosition.y
        );

        player.currentFloor =
            startingFloorNumber;

        const inventory = getInventoryForSession(auth.userId, player);

        if (inventory.weapon) {
            player.weapon.id = inventory.weapon.itemId;
            player.weapon.damage = inventory.weapon.upgradedStats.damage.value;
            //player.weapon.icon = inventory.weapon.icon;
        }
        
        this.state.players.set(client.sessionId, player);

        this.ensureFloorEnemiesLoaded(
            startingFloorNumber
        );

        console.log(`${client.sessionId} joined dungeon`);
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
        const player =
            this.state.players.get(
                client.sessionId
            );

        const previousFloor =
            player?.currentFloor;

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

        if (
            previousFloor !==
            undefined
        ) {
            this.unloadFloorEnemiesIfEmpty(
                previousFloor
            );
        }

        console.log(
            `${client.sessionId} left dungeon`
        );
    }

    private getRuntimeEnemyId(
        floorNumber: number,
        enemyId: string
    ) {
        return `floor_${floorNumber}_${enemyId}`;
    }
    /*
    private loadAllFloorEnemies() {
        this.state.enemies.clear();

        for (const [floorNumberText, floor] of Object.entries(
            this.dungeon.floors
        )) {
            const floorNumber = Number(floorNumberText);

            for (const enemyDef of floor.enemies) {
                const enemy = spawnDemon(
                    enemyDef.x,
                    enemyDef.y
                );

                enemy.type = enemyDef.type;
                enemy.hp = enemyDef.hp;
                enemy.maxHp = enemyDef.maxHp;
                enemy.state = "idle";
                enemy.currentFloor = floorNumber;

                this.state.enemies.set(
                    enemyDef.id,
                    enemy
                );
            }
        }
    }
        */
    public ensureFloorEnemiesLoaded(
        floorNumber: number
    ) {
        if (
            this.loadedEnemyFloors.has(
                floorNumber
            )
        ) {
            return;
        }

        const floor =
            this.dungeon.floors[floorNumber];

        if (!floor) {
            console.error(
                `Cannot load enemies for missing floor ${floorNumber}.`
            );

            return;
        }

        for (const enemyDef of floor.enemies) {
            const runtimeEnemyId =
                this.getRuntimeEnemyId(
                    floorNumber,
                    enemyDef.id
                );

            const enemy = spawnDemon(
                enemyDef.x,
                enemyDef.y
            );

            enemy.type = enemyDef.type;
            enemy.hp = enemyDef.hp;
            enemy.maxHp = enemyDef.maxHp;
            enemy.state = "idle";
            enemy.currentFloor =
                floorNumber;

            this.state.enemies.set(
                runtimeEnemyId,
                enemy
            );
        }

        this.loadedEnemyFloors.add(
            floorNumber
        );

        console.log(
            `Loaded enemies for floor ${floorNumber}.`
        );
    }

    private hasPlayersOnFloor(
        floorNumber: number
    ) {
        let foundPlayer = false;

        this.state.players.forEach(
            (player) => {
                if (
                    player.currentFloor ===
                    floorNumber
                ) {
                    foundPlayer = true;
                }
            }
        );

        return foundPlayer;
    }

    public unloadFloorEnemiesIfEmpty(
        floorNumber: number
    ) {
        if (
            this.hasPlayersOnFloor(
                floorNumber
            )
        ) {
            return;
        }

        const enemyIdsToRemove:
            string[] = [];

        this.state.enemies.forEach(
            (enemy, enemyId) => {
                if (
                    enemy.currentFloor ===
                    floorNumber
                ) {
                    enemyIdsToRemove.push(
                        enemyId
                    );
                }
            }
        );

        for (
            const enemyId
            of enemyIdsToRemove
        ) {
            this.state.enemies.delete(
                enemyId
            );

            clearEnemyContributors(
                enemyId
            );
        }

        this.loadedEnemyFloors.delete(
            floorNumber
        );

        console.log(
            `Unloaded enemies for empty floor ${floorNumber}.`
        );
    }

    public awardEnemyExperience(
        enemyId: string,
        enemy: EnemyState
    ) {
        const contributors =
            getEnemyContributors(enemyId);

        if (!contributors) {
            return;
        }

        const xpReward =
            this.getEnemyXpReward(enemy);

        for (const sessionId of contributors) {
            const player =
                this.state.players.get(sessionId);

            if (!player) {
                continue;
            }

            const client =
                this.clients.find(
                    roomClient =>
                        roomClient.sessionId ===
                        sessionId
                );

            const userId = this.getUserId(client);

            const inventory = getInventoryForSession(userId, player);

            addXpToEquippedGear(
                inventory,
                xpReward
            );

            

            client?.send("inventory_updated", {
                enemyId,
                xpGained: xpReward,
                inventory:
                    hydrateInventory(inventory),
            });

            console.log("INVENTORY WEAPON AFTER XP GAIN: ", hydrateInventory(inventory).weapon)
        }

        clearEnemyContributors(enemyId);
    }
    private getEnemyXpReward(
        enemy: EnemyState
    ) {
        switch (enemy.type) {
            case "demon":
                return 25;

            case "demon_boss":
                return 250;

            default:
                return 10;
        }
    }

    getPlayerFloor(player: PlayerState): DungeonFloor | undefined {
        return this.dungeon.floors[player.currentFloor];
    }

    getFloor(floorNumber: number): DungeonFloor | undefined {
        return this.dungeon.floors[floorNumber];
    }
}
import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { GameState } from "../schemas/GameState.js";
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

export class DungeonRoom extends Room<GameState> {
    maxClients = 4;
    patchRate = 1;
    state = new GameState();

    private numFloors = 5;
    private dungeon = generateDungeon(this.numFloors, 60, 60);
    private enemyIdCounter = 0;
    private currentFloor = 1;

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
            if (!floor) return;

            runPlayerMovement(
                this.state.players,
                deltaTime,
                floor.map
            );

            runEnemySimulation(
                this.state.enemies,
                this.state.players,
                deltaTime,
                floor.map,
                this.clock.currentTime
            );
        });

        this.loadFloorState(this.currentFloor);
    }

    onJoin(client: Client) {
        const spawn = this.dungeon.floors[1].playerSpawn;

        const player = spawnPlayer(
            spawn.x * 64 + 32,
            spawn.y * 64 + 32
        );

        //player.weapon.id = "great_sword1";
        //player.weapon.damage = 10;
        //player.weapon.icon = "great_sword1";

        this.state.players.set(client.sessionId, player);

        console.log(`${client.sessionId} joined dungeon`);
    }

    onLeave(client: Client) {
        this.state.players.delete(client.sessionId);

        console.log(`${client.sessionId} left dungeon`);
        //this.state.players.delete(client.sessionId);
        //deleteInventoryForSession(client.sessionId);
    }

    private addDemon(x: number, y: number) {
        const enemy = spawnDemon(x, y);
        const id = `enemy_${this.enemyIdCounter++}`;

        this.state.enemies.set(id, enemy);
    }

    private loadFloorState(floorIndex: number) {
        const floor = this.dungeon.floors[floorIndex];
        if (!floor) return;

        this.currentFloor = floorIndex;

        this.state.enemies.clear();
        this.state.chests?.clear?.(); // only if you have chests in schema

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
}
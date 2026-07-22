import type { MapSchema } from "@colyseus/schema";
import type {
    EnemyState,
    PlayerState,
} from "../schemas/GameState.js";
import type {
    DungeonFloor,
} from "../shared/dungeon/dungeonTypes.js";
import { updateEnemy } from "./enemy/demon.js";

export function runEnemySimulation(
    enemies: MapSchema<EnemyState>,
    players: MapSchema<PlayerState>,
    deltaTime: number,
    getFloor: (
        floorNumber: number
    ) => DungeonFloor | undefined,
    currentTime: number
) {
    enemies.forEach((enemy) => {
        const floor =
            getFloor(
                enemy.currentFloor
            );

        if (!floor) return;

        const playersOnFloor: PlayerState[] = [];

        players.forEach((player) => {
            if (
                player.currentFloor !==
                enemy.currentFloor
            ) {
                return;
            }

            playersOnFloor.push(
                player
            );
        });

        if (playersOnFloor.length === 0) {
            enemy.state = "idle";
            return;
        }

        updateEnemy(
            enemy,
            playersOnFloor,
            deltaTime,
            floor.map,
            currentTime
        );
    });
}
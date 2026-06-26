import type { MapSchema } from "@colyseus/schema";
import type { EnemyState, PlayerState } from "../schemas/GameState.js";
import { updateDemon } from "./enemy/demon.js";
import type { TileType } from "../shared/dungeon/dungeonTypes.js";

export function runEnemySimulation(
    enemies: MapSchema<EnemyState>,
    players: MapSchema<PlayerState>,
    deltaTime: number,
    dungeonMap: TileType[][]
) {
    enemies.forEach((enemy) => {
        if (enemy.type === "demon") {
            updateDemon(enemy, players, deltaTime, dungeonMap);
        }
    });
}
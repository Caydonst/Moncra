import type { MapSchema } from "@colyseus/schema";
import type { EnemyState, PlayerState } from "../schemas/GameState.js";
import { updateDemon } from "./enemy/demon.js";
import type { TileType } from "../shared/dungeon/dungeonTypes.js";

export function runEnemySimulation(
    enemies: MapSchema<EnemyState>,
    players: MapSchema<PlayerState>,
    deltaTime: number,
    dungeonMap: TileType[][],
    now: number
) {
    enemies.forEach((enemy) => {
        if (enemy.type !== "demon") return;

        if (enemy.isDead || enemy.state === "dead") {
            enemy.vx = 0;
            enemy.vy = 0;
            return;
        }

        updateDemon(enemy, players, deltaTime, dungeonMap, now);
    });
}
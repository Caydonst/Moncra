import { updateDemon } from "./enemy/demon.js";
export function runEnemySimulation(enemies, players, deltaTime, dungeonMap, now) {
    enemies.forEach((enemy) => {
        if (enemy.type !== "demon")
            return;
        if (enemy.isDead || enemy.state === "dead") {
            enemy.vx = 0;
            enemy.vy = 0;
            return;
        }
        updateDemon(enemy, players, deltaTime, dungeonMap, now);
    });
}
//# sourceMappingURL=runEnemySimulation.js.map
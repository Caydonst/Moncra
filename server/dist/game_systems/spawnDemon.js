import { EnemyState } from "../schemas/GameState.js";
export function spawnDemon(x, y) {
    const enemy = new EnemyState();
    enemy.type = "demon";
    enemy.x = x;
    enemy.y = y;
    enemy.hp = 100;
    enemy.maxHp = 100;
    return enemy;
}
//# sourceMappingURL=spawnDemon.js.map
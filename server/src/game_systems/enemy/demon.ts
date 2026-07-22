import { MapSchema } from "@colyseus/schema";
import { EnemyState, PlayerState } from "../../schemas/GameState.js";
import { canMoveTo } from "../collisions/collisions.js";
import type { TileType } from "../../shared/dungeon/dungeonTypes.js";

const AGGRO_RANGE = 500;
const DEMON_SPEED = 220;

const DEMON_WIDTH = 30;
const DEMON_HEIGHT = 40;


export function updateEnemy(
    enemy: EnemyState,
    players: PlayerState[],
    deltaMs: number,
    dungeonMap: TileType[][],
    now: number
) {
    if (enemy.isDead) return;

    const dt = deltaMs / 1000;

    if (enemy.knockbackUntil > now) {
        enemy.state = "hurt";

        const friction = 0.60;

        const nextX = enemy.x + enemy.knockbackX * dt;
        const nextY = enemy.y + enemy.knockbackY * dt;

        if (canMoveTo(dungeonMap, nextX, enemy.y, DEMON_WIDTH, DEMON_HEIGHT)) {
            enemy.x = nextX;
        } else {
            enemy.knockbackX = 0;
        }

        if (canMoveTo(dungeonMap, enemy.x, nextY, DEMON_WIDTH, DEMON_HEIGHT)) {
            enemy.y = nextY;
        } else {
            enemy.knockbackY = 0;
        }

        enemy.knockbackX *= friction;
        enemy.knockbackY *= friction;

        enemy.vx = enemy.knockbackX;
        enemy.vy = enemy.knockbackY;

        return;
    }

    enemy.knockbackX = 0;
    enemy.knockbackY = 0;

    let closestPlayer: PlayerState | null = null;
    let closestDist = Infinity;

    players.forEach((player) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist < closestDist) {
            closestDist = dist;
            closestPlayer = player;
        }
    });

    if (!closestPlayer || closestDist > AGGRO_RANGE) {
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.isAggro = false;
        enemy.state = "idle";
        return;
    }

    enemy.isAggro = true;
    enemy.state = "walk";

    const dx = closestPlayer.x - enemy.x;
    const dy = closestPlayer.y - enemy.y;
    const mag = Math.hypot(dx, dy) || 1;

    const dirX = dx / mag;
    const dirY = dy / mag;

    enemy.vx = dirX * DEMON_SPEED;
    enemy.vy = dirY * DEMON_SPEED;

    const nextX = enemy.x + enemy.vx * dt;
    const nextY = enemy.y + enemy.vy * dt;

    if (canMoveTo(dungeonMap, nextX, enemy.y, DEMON_WIDTH, DEMON_HEIGHT)) {
        enemy.x = nextX;
    } else {
        enemy.vx = 0;
    }

    if (canMoveTo(dungeonMap, enemy.x, nextY, DEMON_WIDTH, DEMON_HEIGHT)) {
        enemy.y = nextY;
    } else {
        enemy.vy = 0;
    }
}
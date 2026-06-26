import type { MapSchema } from "@colyseus/schema";
import type { PlayerState } from "../schemas/GameState.js";
import {
    BASE_SPEED,
    DASH_SPEED,
    DASH_TIME,
} from "./player/player.js";
import { canMoveTo } from "./collisions/collisions.js";
import type { TileType } from "../shared/dungeon/dungeonTypes.js";

export function runPlayerMovement(
    players: MapSchema<PlayerState>,
    deltaTime: number,
    dungeonMap?: TileType[][]
) {
    const dt = deltaTime / 1000;
    const now = Date.now();

    players.forEach((player) => {
        let speed = BASE_SPEED;
        let moveX = player.moveX;
        let moveY = player.moveY;

        if (player.isDashing) {
            const maxStep = DASH_SPEED * dt;

            const stepDistance = Math.min(
                maxStep,
                player.dashDistanceRemaining
            );

            const nextX = player.x + player.dashDirX * stepDistance;
            const nextY = player.y + player.dashDirY * stepDistance;

            if (!dungeonMap) {
                player.x = nextX;
                player.y = nextY;
                return;
            }

            if (canMoveTo(dungeonMap, nextX, player.y, 30, 40)) {
                player.x = nextX;
            }

            if (canMoveTo(dungeonMap, player.x, nextY, 30, 40)) {
                player.y = nextY;
            }

            // collision...

            player.dashDistanceRemaining -= stepDistance;

            if (player.dashDistanceRemaining <= 0) {
                player.isDashing = false;
                player.dashDistanceRemaining = 0;
            }

            return;
        }

        const nextX = player.x + moveX * speed * dt;
        const nextY = player.y + moveY * speed * dt;

        if (!dungeonMap) {
            player.x = nextX;
            player.y = nextY;
            return;
        }

        if (canMoveTo(dungeonMap, nextX, player.y, 30, 40)) {
            player.x = nextX;
        }

        if (canMoveTo(dungeonMap, player.x, nextY, 30, 40)) {
            player.y = nextY;
        }
    });
}
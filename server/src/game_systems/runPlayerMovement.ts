import type { MapSchema } from "@colyseus/schema";
import type { PlayerState } from "../schemas/GameState.js";
import {
    BASE_SPEED,
    DASH_SPEED,
} from "./player/player.js";
import { canMoveTo } from "./collisions/collisions.js";
import type { DungeonFloor } from "../shared/dungeon/dungeonTypes.js";

type GetPlayerFloor = (
    player: PlayerState
) => DungeonFloor | undefined;

export function runPlayerMovement(
    players: MapSchema<PlayerState>,
    deltaTime: number,
    getPlayerFloor?: GetPlayerFloor
) {
    const dt = deltaTime / 1000;

    players.forEach((player) => {
        const floor = getPlayerFloor?.(player);
        const dungeonMap = floor?.map;

        if (player.isDashing) {
            const maxStep = DASH_SPEED * dt;

            const stepDistance = Math.min(
                maxStep,
                player.dashDistanceRemaining
            );

            const nextX =
                player.x +
                player.dashDirX * stepDistance;

            const nextY =
                player.y +
                player.dashDirY * stepDistance;

            if (!dungeonMap) {
                player.x = nextX;
                player.y = nextY;
            } else {
                if (
                    canMoveTo(
                        dungeonMap,
                        nextX,
                        player.y,
                        30,
                        40
                    )
                ) {
                    player.x = nextX;
                }

                if (
                    canMoveTo(
                        dungeonMap,
                        player.x,
                        nextY,
                        30,
                        40
                    )
                ) {
                    player.y = nextY;
                }
            }

            player.dashDistanceRemaining -=
                stepDistance;

            if (
                player.dashDistanceRemaining <= 0
            ) {
                player.isDashing = false;
                player.dashDistanceRemaining = 0;
            }

            return;
        }

        const nextX =
            player.x +
            player.moveX * BASE_SPEED * dt;

        const nextY =
            player.y +
            player.moveY * BASE_SPEED * dt;

        if (!dungeonMap) {
            player.x = nextX;
            player.y = nextY;
            return;
        }

        if (
            canMoveTo(
                dungeonMap,
                nextX,
                player.y,
                30,
                40
            )
        ) {
            player.x = nextX;
        }

        if (
            canMoveTo(
                dungeonMap,
                player.x,
                nextY,
                30,
                40
            )
        ) {
            player.y = nextY;
        }
    });
}
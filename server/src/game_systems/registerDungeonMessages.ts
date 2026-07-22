import type { Client } from "@colyseus/core";
import { tileToWorld } from "../shared/dungeon/dungeonTypes.js";
import type { DungeonRoom } from "../rooms/DungeonRoom.js";

type FloorChangeMessage = {
    targetFloor: number;
};

export function registerDungeonMessages(
    room: DungeonRoom
) {
    room.onMessage(
        "floor_change",
        (
            client: Client,
            data: FloorChangeMessage
        ) => {
            const player =
                room.state.players.get(
                    client.sessionId
                );

            if (!player) return;

            const targetFloorNumber =
                Number(
                    data.targetFloor
                );

            if (
                !Number.isInteger(
                    targetFloorNumber
                )
            ) {
                return;
            }

            const targetFloor =
                room.getFloor(
                    targetFloorNumber
                );

            if (!targetFloor) {
                return;
            }

            const previousFloorNumber =
                player.currentFloor;

            const spawnPosition =
                tileToWorld(
                    targetFloor.playerSpawn.x,
                    targetFloor.playerSpawn.y
                );

            player.currentFloor =
                targetFloorNumber;

            player.x =
                spawnPosition.x;

            player.y =
                spawnPosition.y;

            player.moveX = 0;
            player.moveY = 0;

            player.isDashing = false;
            player.dashDistanceRemaining =
                0;

            room.ensureFloorEnemiesLoaded(
                targetFloorNumber
            );

            room.unloadFloorEnemiesIfEmpty(
                previousFloorNumber
            );

            client.send(
                "floor_changed",
                {
                    floorNumber:
                        targetFloorNumber,
                    spawn:
                        spawnPosition,
                }
            );
        }
    );
}
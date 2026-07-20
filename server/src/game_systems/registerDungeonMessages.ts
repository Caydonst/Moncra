import type { Room, Client } from "@colyseus/core";
import type { EnemyState, GameState } from "../schemas/GameState.js";
import { tileToWorld } from "../shared/dungeon/dungeonTypes.js";
import type { DungeonRoom } from "../rooms/DungeonRoom.js";


export function registerDungeonMessages(room: DungeonRoom) {
    room.onMessage("floor_change", (client: Client, data) => {
        const player = room.state.players.get(client.sessionId);
        if (!player) return;

        const targetFloor = Number(data.targetFloor);
        const floor = room.dungeon.floors[targetFloor];

        if (!floor) return;

        room.loadFloorState(targetFloor);

        const spawnPos = tileToWorld(
            floor.playerSpawn.x,
            floor.playerSpawn.y
        );

        player.x = spawnPos.x;
        player.y = spawnPos.y;

        room.currentFloor = targetFloor;
    });

}
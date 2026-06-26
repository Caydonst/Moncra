import { Client, Room } from "@colyseus/core";
import { tileToWorld } from "../shared/dungeon/dungeonTypes.js";

export function registerDungeonMessages(room: Room<GameState>) {
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
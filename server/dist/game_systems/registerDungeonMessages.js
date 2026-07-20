import { tileToWorld } from "../shared/dungeon/dungeonTypes.js";
export function registerDungeonMessages(room) {
    room.onMessage("floor_change", (client, data) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        const targetFloor = Number(data.targetFloor);
        const floor = room.dungeon.floors[targetFloor];
        if (!floor)
            return;
        room.loadFloorState(targetFloor);
        const spawnPos = tileToWorld(floor.playerSpawn.x, floor.playerSpawn.y);
        player.x = spawnPos.x;
        player.y = spawnPos.y;
        room.currentFloor = targetFloor;
    });
}
//# sourceMappingURL=registerDungeonMessages.js.map
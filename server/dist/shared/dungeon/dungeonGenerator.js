import { TILE_SIZE } from "./dungeonTypes.js";
import { generateDungeonFloor } from "./mapGenerator.js";
export function generateDungeon(numFloors, rows, cols) {
    const floors = {};
    for (let floorIndex = 1; floorIndex <= numFloors; floorIndex++) {
        const baseFloor = generateDungeonFloor(rows, cols);
        floors[floorIndex] = {
            ...baseFloor,
            enemies: createEnemies(baseFloor, floorIndex),
            chests: createChests(baseFloor, floorIndex),
            portal: createPortal(baseFloor, floorIndex, numFloors),
        };
    }
    return {
        floors,
        worldBounds: {
            width: cols * TILE_SIZE,
            height: rows * TILE_SIZE,
        },
    };
}
function createChests(floor, floorIndex) {
    const chests = [];
    floor.rooms.forEach((room, index) => {
        if (Math.random() >= 0.5)
            return;
        chests.push({
            id: `floor_${floorIndex}_chest_${index}`,
            x: room.centerX * TILE_SIZE + TILE_SIZE / 2,
            y: room.centerY * TILE_SIZE + TILE_SIZE / 2,
            items: Array(12).fill(null),
            opened: false,
        });
    });
    return chests;
}
function createPortal(floor, floorIndex, numFloors) {
    return {
        x: floor.exitSpawn.x * TILE_SIZE + TILE_SIZE / 2,
        y: floor.exitSpawn.y * TILE_SIZE + TILE_SIZE / 2,
        targetFloor: floorIndex >= numFloors ? "hub" : floorIndex + 1,
    };
}
function createEnemies(floor, floorIndex) {
    const enemies = [];
    for (let i = 0; i < 30; i++) {
        const pos = getRandomEnemySpawn(floor);
        enemies.push({
            id: `floor_${floorIndex}_enemy_${i}`,
            type: "demon",
            x: pos.x,
            y: pos.y,
            hp: 100,
            maxHp: 100,
            damage: 10,
        });
    }
    return enemies;
}
function getRandomEnemySpawn(floor) {
    let room;
    let isPlayerSpawnRoom = true;
    const spawn = floor.playerSpawn;
    while (isPlayerSpawnRoom) {
        room = floor.rooms[Math.floor(Math.random() * floor.rooms.length)];
        isPlayerSpawnRoom =
            spawn.x >= room.x &&
                spawn.x < room.x + room.w &&
                spawn.y >= room.y &&
                spawn.y < room.y + room.h;
    }
    if (!room)
        return;
    const tileX = randomInt(room.x + 1, room.x + room.w - 2);
    const tileY = randomInt(room.y + 1, room.y + room.h - 2);
    return {
        x: tileX * TILE_SIZE + TILE_SIZE / 2,
        y: tileY * TILE_SIZE + TILE_SIZE / 2,
    };
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//# sourceMappingURL=dungeonGenerator.js.map
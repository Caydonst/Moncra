import * as ex from "excalibur";

enum TileType {
  Empty,
  Floor,
  Wall,
  Door,
}

const TILE_SIZE = 64;
const HALLWAY_SIZE = 4;
const HALF_HALL = Math.floor(HALLWAY_SIZE / 2);

export function tileToWorld(x: number, y: number) {
  return ex.vec(
    x * TILE_SIZE + TILE_SIZE / 2,
    y * TILE_SIZE + TILE_SIZE / 2
  );
}

function carveRoom(map: TileType[][], x: number, y: number, w: number, h: number) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      map[row][col] = TileType.Floor;
    }
  }
}

function carveHorizontal(map: TileType[][], x1: number, x2: number, y: number) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    for (let offset = -HALF_HALL; offset < HALF_HALL; offset++) {
      const yy = y + offset;

      if (
        yy >= 0 &&
        yy < map.length &&
        x >= 0 &&
        x < map[0].length
      ) {
        map[yy][x] = TileType.Floor;
      }
    }
  }
}

function carveVertical(map: TileType[][], y1: number, y2: number, x: number) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    for (let offset = -HALF_HALL; offset < HALF_HALL; offset++) {
      const xx = x + offset;

      if (
        y >= 0 &&
        y < map.length &&
        xx >= 0 &&
        xx < map[0].length
      ) {
        map[y][xx] = TileType.Floor;
      }
    }
  }
}

function addWalls(map: TileType[][]) {
  for (let y = 1; y < map.length - 1; y++) {
    for (let x = 1; x < map[0].length - 1; x++) {
      if (map[y][x] !== TileType.Empty) continue;

      const nearFloor =
        map[y - 1][x] === TileType.Floor ||
        map[y + 1][x] === TileType.Floor ||
        map[y][x - 1] === TileType.Floor ||
        map[y][x + 1] === TileType.Floor;

      if (nearFloor) {
        map[y][x] = TileType.Wall;
      }
    }
  }
}

type Room = {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
};

export function generateDungeon(rows: number, cols: number) {
  const map: TileType[][] = [];

  for (let y = 0; y < rows; y++) {
    map[y] = [];
    for (let x = 0; x < cols; x++) {
      map[y][x] = TileType.Empty;
    }
  }

  const rooms: Room[] = [];
  const maxRooms = 15;

  for (let i = 0; i < maxRooms; i++) {
    const w = randomInt(8, 20);
    const h = randomInt(8, 20);

    const x = randomInt(1, cols - w - 2);
    const y = randomInt(1, rows - h - 2);

    const room: Room = {
      x,
      y,
      w,
      h,
      centerX: Math.floor(x + w / 2),
      centerY: Math.floor(y + h / 2),
    };

    const overlaps = rooms.some(other => roomsOverlap(room, other));

    if (overlaps) continue;

    carveRoom(map, x, y, w, h);

    if (rooms.length > 0) {
      const previous = rooms[rooms.length - 1];

      if (Math.random() < 0.5) {
        carveHorizontal(map, previous.centerX, room.centerX, previous.centerY);
        carveVertical(map, previous.centerY, room.centerY, room.centerX);
      } else {
        carveVertical(map, previous.centerY, room.centerY, previous.centerX);
        carveHorizontal(map, previous.centerX, room.centerX, room.centerY);
      }
    }

    rooms.push(room);
  }

  addWalls(map);

  if (rooms.length === 0) {
    throw new Error("Dungeon generation failed: no rooms were created.");
  }

  return {
    map,
    rooms,
    playerSpawn: ex.vec(rooms[0].centerX, rooms[0].centerY),
    exitSpawn: ex.vec(
      rooms[rooms.length - 1].centerX,
      rooms[rooms.length - 1].centerY
    ),
  };
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roomsOverlap(a: Room, b: Room) {
  return (
    a.x <= b.x + b.w &&
    a.x + a.w >= b.x &&
    a.y <= b.y + b.h &&
    a.y + a.h >= b.y
  );
}

export function createTileMapFromDungeon(
  dungeonMap: TileType[][],
  tileset: ex.SpriteSheet
) {
  const rows = dungeonMap.length;
  const cols = dungeonMap[0].length;

  const tileMap = new ex.TileMap({
    rows,
    columns: cols,
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  });

  // Change these indexes to match your tileset
  const floorSprite = tileset.sprites[0];
  const wallSprite = tileset.sprites[1];
  const doorSprite = tileset.sprites[2];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = tileMap.getTile(x, y);
      const type = dungeonMap[y][x];

      if (type === TileType.Empty) {
        continue;
      }

      if (type === TileType.Floor) {
        tile.addGraphic(floorSprite);
        tile.solid = false;
      }

      if (type === TileType.Wall) {
        tile.addGraphic(wallSprite);
        tile.solid = true;
      }

      if (type === TileType.Door) {
        tile.addGraphic(doorSprite);
        tile.solid = false;
      }
    }
  }

  return tileMap;
}
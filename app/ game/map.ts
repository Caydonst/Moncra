/*
function parseCSV(raw: string): number[][] {
    return raw
        .trim()
        .split(/\r?\n/)
        .map(row =>
            row
                .split(",")
                .map(cell => Number(cell.trim()))
        );
}

export async function loadMapData() {
    const { layer1, layer2, layer3 } = await loadMaps();

    return {
        layer1: parseCSV(layer1),
        layer2: parseCSV(layer2),
        layer3: parseCSV(layer3),
    };
}

async function loadMaps() {
    const layer1 = await fetch('/maps/tilemap2/test_tilemap2_Layer1.csv')
        .then(res => res.text());

    const layer2 = await fetch('/maps/tilemap2/test_tilemap2_Layer2.csv')
        .then(res => res.text());

    const layer3 = await fetch('/maps/tilemap2/test_tilemap2_Layer3.csv')
        .then(res => res.text());

    return { layer1, layer2, layer3 };
}

export const TILE_SIZE = 70;
const SCALE = TILE_SIZE / 16;

// Create a TileMap
export function createTileMaps(ex: any, mapLayer1Data: number[][]) {
    const COLS = mapLayer1Data[0].length;
    const ROWS = mapLayer1Data.length;

    const tilemap1 = new ex.TileMap({
        pos: ex.vec(0, 0),
        columns: COLS,
        rows: ROWS,
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
    });

    const tilemap2 = new ex.TileMap({
        pos: ex.vec(0, 0),
        columns: COLS,
        rows: ROWS,
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
    });

    const tilemap3 = new ex.TileMap({
        pos: ex.vec(0, 0),
        columns: COLS,
        rows: ROWS,
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
    });

    tilemap1.z = 1;
    tilemap2.z = 5;
    tilemap3.z = 5;

    return { tilemap1, tilemap2, tilemap3 };
}

export const floorTilePositions: ex.Vector[] = [];

export function loadTileMaps(
    ex: any,
    tilemap1: ex.TileMap,
    tilemap3: ex.TileMap,
    mapLayer1Data: number[][],
    mapLayer3Data: number[][],
    tileSheet: any,
) {
    const TILES_PER_ROW = tileSheet.columns; // number of sprites per row in your sheet
    // --------------------------- FLOOR ----------------------------------
    for (let y = 0; y < mapLayer1Data.length; y++) {
        for (let x = 0; x < mapLayer1Data[y].length; x++) {

            const value = mapLayer1Data[y][x];

            if (!Number.isFinite(value) || value < 0) continue;

            let sprite;
            let solid = false;

            const centerX = x * TILE_SIZE + TILE_SIZE / 2;
            const centerY = y * TILE_SIZE + TILE_SIZE / 2;
            floorTilePositions.push(ex.vec(centerX, centerY));

            // -----------------------------
            // Convert tile index → sheet coords
            // -----------------------------
            const sheetX = value % TILES_PER_ROW;
            const sheetY = Math.floor(value / TILES_PER_ROW);

            sprite = tileSheet.getSprite(sheetX, sheetY);

            if (sprite) {
                sprite.scale = ex.vec(SCALE, SCALE);

                const tile = tilemap1.getTile(x, y);
                if (tile) {
                    tile.addGraphic(sprite);
                    tile.solid = solid;
                }
            }
        }
    }


// --------------------------- MISC ----------------------------------
    for (let y = 0; y < mapLayer3Data.length; y++) {
        for (let x = 0; x < mapLayer3Data[y].length; x++) {


            const value = mapLayer3Data[y][x];

            if (!Number.isFinite(value) || value < 0) continue;

            let sprite;
            let solid = false;

            const sheetX = value % TILES_PER_ROW;
            const sheetY = Math.floor(value / TILES_PER_ROW);

            sprite = tileSheet.getSprite(sheetX, sheetY);
            if (sprite) {
                // Scale sprite to fill the tile
                sprite.scale = ex.vec(SCALE, SCALE);
                const tile: ex.Tile | null = tilemap3.getTile(x, y);
                if (tile) {
                    tile?.addGraphic(sprite);
                    tile.solid = solid;
                }
            }
        }
    }
}

// --------------------------- WALLS ----------------------------------
export function spawnWallsInto(ex: any, scene: ex.Scene, mapLayer2Data: number[][], tileSheet: any, collisionGroups: any) {
    const TILES_PER_ROW = tileSheet.columns;

    for (let y = 0; y < mapLayer2Data.length; y++) {
        for (let x = 0; x < mapLayer2Data[y].length; x++) {

            const value = mapLayer2Data[y][x];
            if (!Number.isFinite(value) || value < 0) continue;

            const sheetX = value % TILES_PER_ROW;
            const sheetY = Math.floor(value / TILES_PER_ROW);

            const sprite = tileSheet.getSprite(sheetX, sheetY);
            if (!sprite) continue;

            // scale sprite to fill tile
            sprite.scale = ex.vec(SCALE, SCALE);

            // ensure alignment with actor anchor


            // CORRECT POSITION
            const worldX = x * TILE_SIZE;
            const worldY = y * TILE_SIZE;

            const tileActor = new ex.Actor({
                pos: ex.vec(worldX, worldY),
                anchor: ex.vec(0, 0),
                width: TILE_SIZE,
                height: TILE_SIZE,
                collisionType: ex.CollisionType.Fixed,
                collisionGroup: collisionGroups.wallGroup,
            });

            tileActor.graphics.use(sprite);

            scene.add(tileActor);
        }
    }
}

 */

export const TILE_SIZE = 70;

export const MAP_COLS = 30;
export const MAP_ROWS = 20;

export const worldWidth = MAP_COLS * TILE_SIZE;
export const worldHeight = MAP_ROWS * TILE_SIZE;

export const floorTilePositions: any[] = [];

export function createSimpleMap(ex: any, scene: any, collisionGroups: any) {
    floorTilePositions.length = 0;

    for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
            const isWall =
                x === 0 ||
                y === 0 ||
                x === MAP_COLS - 1 ||
                y === MAP_ROWS - 1;

            const worldX = x * TILE_SIZE;
            const worldY = y * TILE_SIZE;

            if (isWall) {
                const wall = new ex.Actor({
                    pos: ex.vec(worldX, worldY),
                    anchor: ex.vec(0, 0),
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    color: ex.Color.fromHex("#6e6e6e"),
                    collisionType: ex.CollisionType.Fixed,
                    collisionGroup: collisionGroups.wallGroup,
                    z: 2,
                });

                wall.tags.add("wall");
                scene.add(wall);
            } else {
                const isDark = (x + y) % 2 === 0;

                const floor = new ex.Actor({
                    pos: ex.vec(worldX, worldY),
                    anchor: ex.vec(0, 0),
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    color: isDark
                        ? ex.Color.fromHex("#1c1c1c")
                        : ex.Color.fromHex("#1f1f1f"),
                    collisionType: ex.CollisionType.PreventCollision,
                    z: 0,
                });

                scene.add(floor);

                floorTilePositions.push(
                    ex.vec(worldX + TILE_SIZE / 2, worldY + TILE_SIZE / 2)
                );
            }
        }
    }
}



// map.ts - Full isometric tile renderer for Excalibur.js

import * as ex from "excalibur";
import { tileSheet } from "./resources";

import mapLayer1 from "./assets/maps/isometric/isometric_tilemap_Layer1.csv?raw";
import mapLayer2 from "./assets/maps/isometric/isometric_tilemap_Layer2.csv?raw";

function parseCSV(raw: string): number[][] {
    return raw.trim().split("\n").map(r => r.split(",").map(Number));
}

// ==============================
// TILE CONFIG
// ==============================

// Size of your world tiles (not sprite size)
export const TILE_W = 80;    // width of a ground tile in world space
export const TILE_H = 40;    // height of a ground tile in isometric projection

// Scale sprites from your tilesheet into world tile size
const SPRITE_SCALE = TILE_W / 16;

export const mapLayer1Data = parseCSV(mapLayer1);
export const mapLayer2Data = parseCSV(mapLayer2);

const COLS = mapLayer1Data[0].length;
const ROWS = mapLayer1Data.length;

export const worldWidth = COLS * TILE_W;
export const worldHeight = ROWS * TILE_H;

export const floorTilePositions: ex.Vector[] = [];

const TILES_PER_ROW = tileSheet.columns;

// ==============================
// ISO PROJECTION
// ==============================
// Converts grid X/Y → isometric screen coords
function toIso(x: number, y: number) {
    return ex.vec(
        (x - y) * (TILE_W / 2),
        (x + y) * (TILE_H / 2)
    );
}

// ==============================
// TILE CREATION FUNCTION
// ==============================

function createIsoTile(
    spriteIndex: number,
    x: number,
    y: number,
    layerZ: number,
    solid: boolean
) {
    if (spriteIndex === -1) return null;

    const sheetX = spriteIndex % TILES_PER_ROW;
    const sheetY = Math.floor(spriteIndex / TILES_PER_ROW);

    const sprite = tileSheet.getSprite(sheetX, sheetY);
    sprite.scale = ex.vec(SPRITE_SCALE, SPRITE_SCALE);

    const iso = toIso(x, y);

    // actor for the tile
    const tile = new ex.Actor({
        pos: iso,
        anchor: ex.vec(0.5, 1), // anchor bottom-center (important for iso overlap)
        z: layerZ + (x + y) * 0.001, // depth-sorting
    });

    tile.graphics.use(sprite);

    // floor positions
    if (layerZ === 1) {
        floorTilePositions.push(iso.clone());
    }

    // mark physics if needed
    if (solid) {
        tile.body.collisionType = ex.CollisionType.Fixed;
    }

    return tile;
}

// ==============================
// ADD ALL LAYERS TO SCENE
// ==============================

export function addIsoMapToScene(scene: ex.Scene) {
    const rows = mapLayer1Data.length;
    const cols = mapLayer1Data[0].length;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {

            const floorVal = mapLayer1Data[y][x];
            const wallsVal = mapLayer2Data[y][x];

            const floorTile = createIsoTile(floorVal, x, y, 1, false);
            const wallTile  = createIsoTile(wallsVal, x, y, 5, true);

            if (floorTile) scene.add(floorTile);
            if (wallTile) scene.add(wallTile);
        }
    }
}


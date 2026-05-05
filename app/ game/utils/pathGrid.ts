import { mapData } from "../map";

// 0 = walkable, 1 = wall
export const grid = mapData.map(row =>
    row.map(tile => (tile === 1 ? 1 : 0))
);

export const ROWS = grid.length;
export const COLS = grid[0].length;

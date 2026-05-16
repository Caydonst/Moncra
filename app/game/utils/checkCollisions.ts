const ex = await import("excalibur");
import { tilemap1, tilemap2 } from "../map.ts";

export function isWallAt(pos: ex.Vector): boolean {
    const tile1 = tilemap1.getTileByPoint(pos);
    const tile2 = tilemap2.getTileByPoint(pos);
    return !!(tile1?.solid || tile2?.solid);

}

export function collidesWithWall8(
    newPos: ex.Vector,
    width: number,
    height: number
): boolean {
    const halfW = width / 2;
    const halfH = height / 2;

    // Edges with padding
    const left   = newPos.x;
    const right  = newPos.x;
    const top    = newPos.y;
    const bottom = newPos.y;

    // Middle points on each side
    const midX   = newPos.x;
    const midY   = newPos.y;

    const pointsToCheck = [
        // 🔵 Corners (4)
        ex.vec(left,  top),       // top-left
        ex.vec(right, top),       // top-right
        ex.vec(left,  bottom),    // bottom-left
        ex.vec(right, bottom),    // bottom-right

        // 🔵 Midpoints (4)
        ex.vec(midX,  top),       // top-middle
        ex.vec(midX,  bottom),    // bottom-middle
        ex.vec(left,  midY),      // left-middle
        ex.vec(right, midY),      // right-middle
    ];

    return pointsToCheck.some(p => isWallAt(p));
}

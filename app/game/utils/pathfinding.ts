const ex = await import("excalibur");
import { grid, ROWS, COLS } from "./pathGrid";

export function findPath(start: ex.Vector, goal: ex.Vector, tileSize: number) {
    const startX = Math.floor(start.x / tileSize);
    const startY = Math.floor(start.y / tileSize);
    const goalX = Math.floor(goal.x / tileSize);
    const goalY = Math.floor(goal.y / tileSize);

    const open: any[] = [{ x: startX, y: startY, g: 0, f: 0 }];
    const cameFrom = new Map<string, string>();
    const cost = new Map<string, number>();
    cost.set(`${startX},${startY}`, 0);

    const dirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],       // cardinal
        [1, 1], [1, -1], [-1, 1], [-1, -1]     // diagonal
    ];

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();
        if (current.x === goalX && current.y === goalY) break;

        for (const [dx, dy] of dirs) {
            const nx = current.x + dx;
            const ny = current.y + dy;

            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            if (grid[ny][nx] === 1) continue; // wall

            // No diagonal corner cutting
            if (dx !== 0 && dy !== 0) {
                if (grid[current.y][current.x + dx] === 1) continue;
                if (grid[current.y + dy][current.x] === 1) continue;
            }

            const moveCost = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
            const newCost = cost.get(`${current.x},${current.y}`) + moveCost;

            const key = `${nx},${ny}`;
            if (!cost.has(key) || newCost < cost.get(key)) {
                cost.set(key, newCost);
                const priority = newCost + heuristic(nx, ny, goalX, goalY);
                open.push({ x: nx, y: ny, g: newCost, f: priority });
                cameFrom.set(key, `${current.x},${current.y}`);
            }
        }
    }

    return reconstructPath(startX, startY, goalX, goalY, cameFrom, tileSize);
}

function heuristic(x1, y1, x2, y2) {
    // Diagonal distance (octile distance)
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.max(dx, dy);
}

function reconstructPath(sx, sy, gx, gy, cameFrom, tileSize) {
    let current = `${gx},${gy}`;
    const path = [];

    while (cameFrom.has(current)) {
        const [x, y] = current.split(",").map(Number);
        path.push(ex.vec(x * tileSize + tileSize / 2,
            y * tileSize + tileSize / 2));
        current = cameFrom.get(current);
    }

    return path.reverse();
}

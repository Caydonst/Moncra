import { DASH_COOLDOWN, DASH_DISTANCE } from "./player/player.js";
export function registerPlayerMessages(room) {
    room.onMessage("player_move", (client, data) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        player.aimAngle = Number(data.aimAngle) || 0;
        // Important: don't overwrite movement while dashing
        if (player.isDashing)
            return;
        let moveX = Number(data.moveX) || 0;
        let moveY = Number(data.moveY) || 0;
        const mag = Math.hypot(moveX, moveY);
        if (mag > 1) {
            moveX /= mag;
            moveY /= mag;
        }
        player.moveX = moveX;
        player.moveY = moveY;
    });
    room.onMessage("player_dash", (client, data) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        const now = Date.now();
        if (now - player.lastDashTime < DASH_COOLDOWN)
            return;
        let dirX = Number(data.dirX) || 0;
        let dirY = Number(data.dirY) || 0;
        const mag = Math.hypot(dirX, dirY);
        if (mag <= 0)
            return;
        dirX /= mag;
        dirY /= mag;
        player.isDashing = true;
        player.lastDashTime = now;
        player.dashDirX = dirX;
        player.dashDirY = dirY;
        player.dashDistanceRemaining = DASH_DISTANCE;
    });
}
//# sourceMappingURL=registerPlayerMessages.js.map
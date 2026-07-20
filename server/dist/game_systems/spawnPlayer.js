import { PlayerState } from "../schemas/GameState.js";
export function spawnPlayer(x = 400, y = 400) {
    const player = new PlayerState();
    player.x = x;
    player.y = y;
    player.hp = 100;
    player.armor = 0;
    player.damage = 0;
    player.crit = 0;
    player.lastMoveTime = Date.now();
    player.lastResolveGainTime = Date.now();
    return player;
}
//# sourceMappingURL=spawnPlayer.js.map
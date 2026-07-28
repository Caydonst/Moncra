import { PlayerState } from "../../schemas/GameState.js";

export const MAX_SPEED = 250
export const BASE_SPEED = 250;
export const DASH_SPEED = 1000;
export const DASH_COOLDOWN = 3000;
export const DASH_DISTANCE = 200;

export function applyPlayerXp(player: PlayerState) {

    player.currentXp += 10;

    if (player.currentXp >= player.xpToNextLvl) {
        player.level += 1;
        player.currentXp -= player.xpToNextLvl;
        player.xpToNextLvl += 250;
    }
}
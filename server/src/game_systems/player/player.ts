import { PlayerState } from "../../schemas/GameState.js";

export const MAX_SPEED = 250
export const BASE_SPEED = 250;
export const DASH_SPEED = 1000;
export const DASH_COOLDOWN = 3000;
export const DASH_DISTANCE = 200;

export function applyInventoryStatsToPlayer(player: PlayerState, inventory: any) {
    const baseHp = 100;
    const baseArmor = 0;
    const baseDamage = 0;
    const baseCrit = 0;

    const equippedItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
    ].filter(Boolean);

    player.maxHp = baseHp;
    player.armor = baseArmor;
    player.damage = baseDamage;
    player.crit = baseCrit;

    for (const item of equippedItems) {
        player.maxHp += item.stats?.hp ?? 0;
        player.armor += item.stats?.armor ?? 0;
        player.damage += item.stats?.damage ?? 0;
        player.crit += item.stats?.crit ?? 0;
    }

    if (player.hp > player.maxHp) {
        player.hp = player.maxHp;
    }
}
// lib/shared/hydrateInventory.ts

import { hydrateSlot } from "./hydrateItem";
import type { ServerInventory } from "./inventoryTypes";

export function hydrateInventory(inventory: ServerInventory) {
    return {
        gold: inventory.gold,
        weapon: hydrateSlot(inventory.weapon),
        helmet: hydrateSlot(inventory.helmet),
        arms: hydrateSlot(inventory.arms),
        chest: hydrateSlot(inventory.chest),
        legs: hydrateSlot(inventory.legs),
        miscWeapons: inventory.miscWeapons.map(hydrateSlot),
        miscArmor: inventory.miscArmor.map(hydrateSlot),
        miscMaterial: inventory.miscMaterial.map(hydrateSlot),
    };
}
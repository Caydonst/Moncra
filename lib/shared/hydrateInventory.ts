// lib/shared/hydrateInventory.ts

import { hydrateItem } from "./hydrateItem";

const hydrateSlot = (item: any) => item ? hydrateItem(item) : null;

export function hydrateInventory(inventory: any) {
    return {
        gold: inventory.gold,
        weapon: hydrateSlot(inventory.weapon),
        armor: hydrateSlot(inventory.armor),
        miscWeapons: inventory.miscWeapons.map(hydrateSlot),
        miscArmor: inventory.miscArmor.map(hydrateSlot),
        miscMaterial: inventory.miscMaterial.map(hydrateSlot),
    };
}
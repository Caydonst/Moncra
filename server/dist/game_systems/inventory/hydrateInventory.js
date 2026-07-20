// lib/shared/hydrateInventory.ts
import { hydrateItem, } from "./hydrateItem.js";
export function hydrateInventory(inventory) {
    return {
        gold: inventory.gold,
        weapon: inventory.weapon
            ? hydrateItem(inventory.weapon)
            : null,
        helmet: inventory.helmet
            ? hydrateItem(inventory.helmet)
            : null,
        arms: inventory.arms
            ? hydrateItem(inventory.arms)
            : null,
        chest: inventory.chest
            ? hydrateItem(inventory.chest)
            : null,
        legs: inventory.legs
            ? hydrateItem(inventory.legs)
            : null,
        miscWeapons: inventory.miscWeapons.map((item) => item
            ? hydrateItem(item)
            : null),
        miscArmor: inventory.miscArmor.map((item) => item
            ? hydrateItem(item)
            : null),
        miscMaterial: inventory.miscMaterial.map((item) => item
            ? hydrateItem(item)
            : null),
    };
}
//# sourceMappingURL=hydrateInventory.js.map
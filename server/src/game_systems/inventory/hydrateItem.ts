// lib/shared/hydrateItem.ts

import { itemDefinitions } from "../items/itemDefinitions.js";
import type { InventoryItemInstance } from "./inventoryTypes.js";
import { rollItemStats } from "../items/itemRolls.js"

export function hydrateItem(instance: InventoryItemInstance) {
    const def = itemDefinitions[instance.itemId];

    if (!def) {
        throw new Error(`Unknown item id: ${instance.itemId}`);
    }

    // -------------------------
    // Weapon
    // -------------------------
    if (def.type === "Weapon") {
        const roll = rollItemStats(def.type, def.rarity);
        if (!roll) return;

        return {
            ...def,
            uid: instance.uid,
            
            stats: {
                power: def.baseStats.power + instance.level * 2,
                damage: roll.damage?.value,
                crit: roll.crit?.value,
                rollPercentage: {
                    damage: roll.damage?.percentage,
                    crit: roll.crit?.percentage,
                }
            },
        };
    }

    // -------------------------
    // Armor
    // -------------------------
    if (def.type === "Armor") {
        const roll = rollItemStats(def.type, def.rarity);
        if (!roll) return;

        return {
            ...def,
            uid: instance.uid,
            level: instance.level,
            stats: {
                power: def.baseStats.power + instance.level * 2,
                hp: roll.hp?.value,
                armor: roll.armor?.value,
                rollPercentage: {
                    hp: roll.hp?.percentage,
                    armor: roll.armor?.percentage,
                }
            },
        };
    }

    // -------------------------
    // Material
    // -------------------------
    if (def.type === "Material") {
        return {
            ...def,
            uid: instance.uid,
            quantity: instance.quantity ?? 1,
        };
    }

    throw new Error(`Unsupported item type: ${def.type}`);
}

export function hydrateSlot(item: InventoryItemInstance | null) {
    return item ? hydrateItem(item) : null;
}
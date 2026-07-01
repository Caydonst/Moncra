// lib/shared/hydrateItem.ts

import { itemDefinitions } from "./itemDefinitions";
import type { InventoryItemInstance } from "./inventoryTypes";

export function hydrateItem(instance: InventoryItemInstance) {
    const def = itemDefinitions[instance.itemId];

    if (!def) {
        throw new Error(`Unknown item id: ${instance.itemId}`);
    }

    // -------------------------
    // Weapon
    // -------------------------
    if (def.type === "Weapon") {
        return {
            ...def,
            uid: instance.uid,
            level: instance.level,
            stats: {
                power: def.baseStats.power + instance.level * 2,
                damage: def.baseStats.damage + instance.level * 2,
            },
        };
    }

    // -------------------------
    // Armor
    // -------------------------
    if (def.type === "Armor") {
        return {
            ...def,
            uid: instance.uid,
            level: instance.level,
            stats: {
                hp: def.baseStats.hp + instance.level * 5,
                defense: def.baseStats.defense + instance.level * 2,
                power: def.baseStats.power + instance.level * 2,
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
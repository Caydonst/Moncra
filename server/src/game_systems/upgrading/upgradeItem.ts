// server/inventory/upgradeItemInInventory.ts

import type { ServerInventory, InventoryItemInstance } from "../inventory/inventoryTypes.js";
import { itemDefinitions } from "../items/itemDefinitions.js";

export function upgradeItem(inventory: ServerInventory, uid: string) {
    const item = findItemByUid(inventory, uid);

    if (!item) {
        return { ok: false as const, error: "Item not found" };
    }

    const def = itemDefinitions[item.itemId];

    if (!def) {
        return { ok: false as const, error: "Unknown item definition" };
    }

    if (item.level === undefined) {
        return { ok: false as const, error: "Item cannot be upgraded" };
    }

    if (item.level >= def.maxLevel) {
        return { ok: false as const, error: "Max level" };
    }

    const goldCost = 100 * (item.level + 1);

    if (inventory.gold < goldCost) {
        return { ok: false as const, error: "Not enough gold" };
    }

    inventory.gold -= goldCost;
    item.level += 1;

    return {
        ok: true as const,
        item,
    };
}

function findItemByUid(inventory: ServerInventory, uid: string): InventoryItemInstance | null {
    const allItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
        ...inventory.miscWeapons,
        ...inventory.miscArmor,
        ...inventory.miscMaterial,
    ].filter(Boolean) as InventoryItemInstance[];

    return allItems.find(item => item.uid === uid) ?? null;
}

function newUpgradeItem(inventory: ServerInventory, uid: string) {
    const item = findItemByUid(inventory, uid);

    
}
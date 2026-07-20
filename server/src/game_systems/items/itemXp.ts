import type {
    InventoryItemInstance,
    ServerInventory,
} from "../inventory/inventoryTypes.js";

export function getItemXpRequired(
    level: number
) {
    return 100 + level * 50;
}

export function addXpToItem(
    item: InventoryItemInstance,
    xp: number
) {
    if (item.type === "Material") return;
    item.currentXp += xp;

    while (item.level < getItemMaxLevel(item)) {
        const requiredXp =
            getItemXpRequired(item.level);

        if (item.currentXp < requiredXp) {
            break;
        }

        item.currentXp -= requiredXp;
        item.level += 1;
        item.availableUpgradePoints += 1;
    }

    if (item.level >= getItemMaxLevel(item)) {
        item.currentXp = 0;
    }
}

export function addXpToEquippedGear(
    inventory: ServerInventory,
    xp: number
) {
    const equippedItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
    ];

    for (const item of equippedItems) {
        if (!item) continue;

        addXpToItem(item, xp);
    }
}

function getItemMaxLevel(
    item: InventoryItemInstance
) {
    return 50;
}
export function getItemXpRequired(level) {
    return 100 + level * 50;
}
export function addXpToItem(item, xp) {
    if (item.type === "Material")
        return;
    item.currentXp += xp;
    while (item.level < getItemMaxLevel(item)) {
        const requiredXp = getItemXpRequired(item.level);
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
export function addXpToEquippedGear(inventory, xp) {
    const equippedItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
    ];
    for (const item of equippedItems) {
        if (!item)
            continue;
        addXpToItem(item, xp);
    }
}
function getItemMaxLevel(item) {
    return 50;
}
//# sourceMappingURL=itemXp.js.map
import { InventoryItemInstance, ServerInventory } from "../inventory/inventoryTypes.js";


export function getItemXpRequired(level: number) {
    return 100 + level * 50;
}

type StatPoints = {
    damage: number;
    crit: number;
    hp: number;
    armor: number;
};

type UpgradeableStat = keyof StatPoints;

type StatPoints = {
    damage: number;
    crit: number;
    hp: number;
    armor: number;
};

type WeaponStat = "damage" | "crit";
type ArmorStat = "hp" | "armor";

function applySinglePointUpgrade<K extends keyof StatPoints>(
    currentPoints: Record<K, number>,
    requestedPoints: StatPoints,
    applicableStats: readonly K[]
) {
    let changedStat: K | null = null;

    for (const stat of applicableStats) {
        const difference =
            requestedPoints[stat] - currentPoints[stat];

        // This request may only leave a stat unchanged or add one point.
        if (difference !== 0 && difference !== 1) {
            return {
                ok: false as const,
                error: `Invalid ${stat} point change.`,
            };
        }

        if (difference === 1) {
            // Prevent changing multiple stats in one request.
            if (changedStat !== null) {
                return {
                    ok: false as const,
                    error: "Only one stat can be upgraded at a time.",
                };
            }

            changedStat = stat;
        }
    }

    if (changedStat === null) {
        return {
            ok: false as const,
            error: "No stat point was added.",
        };
    }

    currentPoints[changedStat] =
        requestedPoints[changedStat];

    return {
        ok: true as const,
        upgradedStat: changedStat,
    };
}

export function upgradeItem(
    inventory: ServerInventory,
    uid: string,
    statPoints: StatPoints
) {
    const item = findInventoryItemByUid(inventory, uid);

    if (!item) {
        return {
            ok: false as const,
            error: "Item not found.",
        };
    }

    if (item.availableUpgradePoints <= 0) {
        return {
            ok: false as const,
            error: "No upgrade points available.",
        };
    }

    const result =
        item.type === "Weapon"
            ? applySinglePointUpgrade(
                item.currentUpgradePoints,
                statPoints,
                ["damage", "crit"] as const
            )
            : applySinglePointUpgrade(
                item.currentUpgradePoints,
                statPoints,
                ["hp", "armor"] as const
            );

    if (!result.ok) {
        return result;
    }

    item.availableUpgradePoints -= 1;

    return {
        ok: true as const,
        item,
        upgradedStat: result.upgradedStat,
    };
}

export function findInventoryItemByUid(
    inventory: ServerInventory,
    uid: string
): InventoryItemInstance | null {
    const equippedItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
    ];

    for (const item of equippedItems) {
        if (item?.uid === uid) {
            return item;
        }
    }

    const storedItems = [
        ...inventory.miscWeapons,
        ...inventory.miscArmor,
        ...inventory.miscMaterial,
    ];

    for (const item of storedItems) {
        if (item?.uid === uid) {
            return item;
        }
    }

    return null;
}
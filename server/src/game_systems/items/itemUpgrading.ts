import { InventoryItemInstance, ServerInventory } from "../inventory/inventoryTypes.js";
import { getMaxStatValue } from "./itemRolls.js";


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

type WeaponStat = "damage" | "crit";
type ArmorStat = "hp" | "armor";

const masteryValuePerLevel = {
    damage: 10,
    crit: 0.5,
    hp: 10,
    armor: 5,
} satisfies Record<UpgradeableStat, number>;

function getSinglePointUpgrade<K extends keyof StatPoints>(
    currentPoints: Record<K, number>,
    requestedPoints: StatPoints,
    applicableStats: readonly K[]
) {
    let changedStat: K | null = null;

    for (const stat of applicableStats) {
        const difference =
            requestedPoints[stat] - currentPoints[stat];

        if (difference !== 0 && difference !== 1) {
            return {
                ok: false as const,
                error: `Invalid ${stat} point change.`,
            };
        }

        if (difference === 1) {
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

    return {
        ok: true as const,
        upgradedStat: changedStat,
    };
}
function canUpgradeStat(
    item: InventoryItemInstance,
    stat: UpgradeStat
): boolean {
    const maximumValue = getMaxStatValue(
        item.rarity,
        stat
    );

    if (item.type === "Weapon") {
        if (stat === "damage") {
            const nextValue =
                item.upgradedStats.damage.value + 10;

            return (
                item.upgradedStats.damage.value < maximumValue &&
                item.upgradedStats.damage.percentage < 100 &&
                nextValue > item.upgradedStats.damage.value
            );
        }

        if (stat === "crit") {
            const nextValue =
                item.upgradedStats.crit.value + 1;

            return (
                item.upgradedStats.crit.value < maximumValue &&
                item.upgradedStats.crit.percentage < 100 &&
                nextValue > item.upgradedStats.crit.value
            );
        }
    }

    if (item.type === "Armor") {
        if (stat === "hp") {
            return (
                item.upgradedStats.hp.value < maximumValue &&
                item.upgradedStats.hp.percentage < 100
            );
        }

        if (stat === "armor") {
            return (
                item.upgradedStats.armor.value < maximumValue &&
                item.upgradedStats.armor.percentage < 100
            );
        }
    }

    return false;
}

function applyStatUpgrade(
    rolledValue: number,
    rolledPercentage: number,
    allocatedPoints: number,
    valuePerPoint: number,
    percentagePerPoint: number,
    maximumValue: number
) {
    return {
        value: Math.min(
            maximumValue,
            rolledValue + allocatedPoints * valuePerPoint
        ),

        percentage: Math.min(
            100,
            rolledPercentage + allocatedPoints * percentagePerPoint
        ),
    };
}

function isNormalStatMaxed(
    item: InventoryItemInstance,
    stat: UpgradeableStat
): boolean {
    const maximumValue = getMaxStatValue(
        item.rarity,
        stat
    );

    if (item.type === "Weapon") {
        if (stat === "damage") {
            const normalValue = Math.min(
                maximumValue,
                item.rolledStats.damage.value +
                item.currentUpgradePoints.damage * 10
            );

            const normalPercentage = Math.min(
                100,
                item.rolledStats.damage.percentage +
                item.currentUpgradePoints.damage * 10
            );

            return (
                normalValue >= maximumValue ||
                normalPercentage >= 100
            );
        }

        if (stat === "crit") {
            const normalValue = Math.min(
                maximumValue,
                item.rolledStats.crit.value +
                item.currentUpgradePoints.crit * 0.5
            );

            const normalPercentage = Math.min(
                100,
                item.rolledStats.crit.percentage +
                item.currentUpgradePoints.crit * 10
            );

            return (
                normalValue >= maximumValue ||
                normalPercentage >= 100
            );
        }

        return false;
    }

    if (stat === "hp") {
        const normalValue = Math.min(
            maximumValue,
            item.rolledStats.hp.value +
            item.currentUpgradePoints.hp * 10
        );

        const normalPercentage = Math.min(
            100,
            item.rolledStats.hp.percentage +
            item.currentUpgradePoints.hp * 10
        );

        return (
            normalValue >= maximumValue ||
            normalPercentage >= 100
        );
    }

    if (stat === "armor") {
        const normalValue = Math.min(
            maximumValue,
            item.rolledStats.armor.value +
            item.currentUpgradePoints.armor * 5
        );

        const normalPercentage = Math.min(
            100,
            item.rolledStats.armor.percentage +
            item.currentUpgradePoints.armor * 10
        );

        return (
            normalValue >= maximumValue ||
            normalPercentage >= 100
        );
    }

    return false;
}

function applyWeaponUpgrade(
    item: Extract<
        InventoryItemInstance,
        { type: "Weapon" }
    >,
    stat: WeaponStat,
    requestedPoints: StatPoints
) {
    if (isNormalStatMaxed(item, stat)) {
        item.masteryStats[stat].level += 1;

        item.masteryStats[stat].value =
            item.masteryStats[stat].level *
            masteryValuePerLevel[stat];

        return {
            upgradeType: "mastery" as const,
            masteryLevel:
                item.masteryStats[stat].level,
            masteryValue:
                item.masteryStats[stat].value,
        };
    }

    item.currentUpgradePoints[stat] =
        requestedPoints[stat];

    return {
        upgradeType: "normal" as const,
    };
}

function applyArmorUpgrade(
    item: Extract<
        InventoryItemInstance,
        { type: "Armor" }
    >,
    stat: ArmorStat,
    requestedPoints: StatPoints
) {
    if (isNormalStatMaxed(item, stat)) {
        item.masteryStats[stat].level += 1;

        item.masteryStats[stat].value =
            item.masteryStats[stat].level *
            masteryValuePerLevel[stat];

        return {
            upgradeType: "mastery" as const,
            masteryLevel:
                item.masteryStats[stat].level,
            masteryValue:
                item.masteryStats[stat].value,
        };
    }

    item.currentUpgradePoints[stat] =
        requestedPoints[stat];

    return {
        upgradeType: "normal" as const,
    };
}

function applyUpgradedStats(item: InventoryItemInstance) {
    if (item.type === "Weapon") {
        const damageMax = getMaxStatValue(
            item.rarity,
            "damage"
        );

        const critMax = getMaxStatValue(
            item.rarity,
            "crit"
        );

        const normalDamage = applyStatUpgrade(
            item.rolledStats.damage.value,
            item.rolledStats.damage.percentage,
            item.currentUpgradePoints.damage,
            10,
            10,
            damageMax
        );

        const normalCrit = applyStatUpgrade(
            item.rolledStats.crit.value,
            item.rolledStats.crit.percentage,
            item.currentUpgradePoints.crit,
            0.5,
            10,
            critMax
        );

        item.masteryStats.damage.value =
            item.masteryStats.damage.level *
            masteryValuePerLevel.damage;

        item.masteryStats.crit.value =
            item.masteryStats.crit.level *
            masteryValuePerLevel.crit;

        item.upgradedStats.damage = {
            value:
                normalDamage.value +
                item.masteryStats.damage.value,

            percentage: normalDamage.percentage,
        };

        item.upgradedStats.crit = {
            value:
                normalCrit.value +
                item.masteryStats.crit.value,

            percentage: normalCrit.percentage,
        };

        return;
    }

    const hpMax = getMaxStatValue(
        item.rarity,
        "hp"
    );

    const armorMax = getMaxStatValue(
        item.rarity,
        "armor"
    );

    const normalHp = applyStatUpgrade(
        item.rolledStats.hp.value,
        item.rolledStats.hp.percentage,
        item.currentUpgradePoints.hp,
        10,
        10,
        hpMax
    );

    const normalArmor = applyStatUpgrade(
        item.rolledStats.armor.value,
        item.rolledStats.armor.percentage,
        item.currentUpgradePoints.armor,
        5,
        10,
        armorMax
    );

    item.masteryStats.hp.value =
        item.masteryStats.hp.level *
        masteryValuePerLevel.hp;

    item.masteryStats.armor.value =
        item.masteryStats.armor.level *
        masteryValuePerLevel.armor;

    item.upgradedStats.hp = {
        value:
            normalHp.value +
            item.masteryStats.hp.value,

        percentage: normalHp.percentage,
    };

    item.upgradedStats.armor = {
        value:
            normalArmor.value +
            item.masteryStats.armor.value,

        percentage: normalArmor.percentage,
    };
}

export function upgradeItem(
    inventory: ServerInventory,
    uid: string,
    statPoints: StatPoints
) {
    const item = findInventoryItemByUid(
        inventory,
        uid
    );

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

    if (item.type === "Weapon") {
        const result = getSinglePointUpgrade(
            item.currentUpgradePoints,
            statPoints,
            ["damage", "crit"] as const
        );

        if (!result.ok) {
            return result;
        }

        const appliedUpgrade = applyWeaponUpgrade(
            item,
            result.upgradedStat,
            statPoints
        );

        item.availableUpgradePoints -= 1;

        applyUpgradedStats(item);

        return {
            ok: true as const,
            item,
            upgradedStat: result.upgradedStat,
            ...appliedUpgrade,
        };
    }

    const result = getSinglePointUpgrade(
        item.currentUpgradePoints,
        statPoints,
        ["hp", "armor"] as const
    );

    if (!result.ok) {
        return result;
    }

    const appliedUpgrade = applyArmorUpgrade(
        item,
        result.upgradedStat,
        statPoints
    );

    item.availableUpgradePoints -= 1;

    applyUpgradedStats(item);

    return {
        ok: true as const,
        item,
        upgradedStat: result.upgradedStat,
        ...appliedUpgrade,
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
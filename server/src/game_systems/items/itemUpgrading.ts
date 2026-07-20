import type {
    ArmorItemInstance,
    InventoryItemInstance,
    ServerInventory,
    WeaponItemInstance,
} from "../inventory/inventoryTypes.js";
import { getMaxStatValue, getMinStatValue } from "./itemRolls.js";

type EquipmentItemInstance =
    | WeaponItemInstance
    | ArmorItemInstance;

type UpgradeItemSuccess = {
    ok: true;
    item: EquipmentItemInstance;
    upgradedStat: UpgradeableStat;
    upgradeType: "normal" | "mastery";
    masteryLevel?: number;
    masteryValue?: number;
};

type UpgradeItemFailure = {
    ok: false;
    error: string;
};

export type UpgradeItemResult =
    | UpgradeItemSuccess
    | UpgradeItemFailure;

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

function applyStatUpgrade(
    rolledValue: number,
    allocatedPoints: number,
    valuePerPoint: number,
    minimumValue: number,
    maximumValue: number
) {
    const value = Math.min(
        maximumValue,
        rolledValue +
        allocatedPoints * valuePerPoint
    );

    const range =
        maximumValue - minimumValue;

    const percentage =
        range <= 0
            ? 100
            : Math.min(
                100,
                Math.max(
                    0,
                    ((value - minimumValue) /
                        range) *
                    100
                )
            );

    return {
        value,
        percentage,
    };
}

function isNormalStatMaxed(
    item: InventoryItemInstance,
    stat: UpgradeableStat
): boolean {
    const minimumValue = getMinStatValue(
        item.rarity,
        stat
    );

    const maximumValue = getMaxStatValue(
        item.rarity,
        stat
    );

    if (item.type === "Weapon") {
        if (stat === "damage") {
            const normalStat = applyStatUpgrade(
                item.rolledStats.damage.value,
                item.currentUpgradePoints.damage,
                10,
                minimumValue,
                maximumValue
            );

            return normalStat.value >= maximumValue;
        }

        if (stat === "crit") {
            const normalStat = applyStatUpgrade(
                item.rolledStats.crit.value,
                item.currentUpgradePoints.crit,
                0.5,
                minimumValue,
                maximumValue
            );

            return normalStat.value >= maximumValue;
        }

        return false;
    }

    if (item.type === "Armor") {
        if (stat === "hp") {
            const normalStat = applyStatUpgrade(
                item.rolledStats.hp.value,
                item.currentUpgradePoints.hp,
                10,
                minimumValue,
                maximumValue
            );

            return normalStat.value >= maximumValue;
        }

        if (stat === "armor") {
            const normalStat = applyStatUpgrade(
                item.rolledStats.armor.value,
                item.currentUpgradePoints.armor,
                5,
                minimumValue,
                maximumValue
            );

            return normalStat.value >= maximumValue;
        }
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

function applyUpgradedStats(
    item: InventoryItemInstance
) {
    if (item.type === "Weapon") {
        const damageMin = getMinStatValue(
            item.rarity,
            "damage"
        );

        const damageMax = getMaxStatValue(
            item.rarity,
            "damage"
        );

        const critMin = getMinStatValue(
            item.rarity,
            "crit"
        );

        const critMax = getMaxStatValue(
            item.rarity,
            "crit"
        );

        const normalDamage = applyStatUpgrade(
            item.rolledStats.damage.value,
            item.currentUpgradePoints.damage,
            10,
            damageMin,
            damageMax
        );

        const normalCrit = applyStatUpgrade(
            item.rolledStats.crit.value,
            item.currentUpgradePoints.crit,
            0.5,
            critMin,
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

            percentage:
                normalDamage.percentage,
        };

        item.upgradedStats.crit = {
            value:
                normalCrit.value +
                item.masteryStats.crit.value,

            percentage:
                normalCrit.percentage,
        };

        return;
    }

    if (item.type === "Armor") {
        const hpMin = getMinStatValue(
            item.rarity,
            "hp"
        );

        const hpMax = getMaxStatValue(
            item.rarity,
            "hp"
        );

        const armorMin = getMinStatValue(
            item.rarity,
            "armor"
        );

        const armorMax = getMaxStatValue(
            item.rarity,
            "armor"
        );

        const normalHp = applyStatUpgrade(
            item.rolledStats.hp.value,
            item.currentUpgradePoints.hp,
            10,
            hpMin,
            hpMax
        );

        const normalArmor = applyStatUpgrade(
            item.rolledStats.armor.value,
            item.currentUpgradePoints.armor,
            5,
            armorMin,
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

            percentage:
                normalHp.percentage,
        };

        item.upgradedStats.armor = {
            value:
                normalArmor.value +
                item.masteryStats.armor.value,

            percentage:
                normalArmor.percentage,
        };
    }
}

export function upgradeItem(
    inventory: ServerInventory,
    uid: string,
    statPoints: StatPoints
): UpgradeItemResult  {
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

    if (item.type === "Material") {
        return {
            ok: false as const,
            error: "Materials cannot be upgraded.",
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
            return {
                ok: false as const,
                error: result.error,
            };
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

    if (item.type === "Armor") {
        const result = getSinglePointUpgrade(
            item.currentUpgradePoints,
            statPoints,
            ["hp", "armor"] as const
        );

        if (!result.ok) {
            return {
                ok: false as const,
                error: result.error,
            };
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
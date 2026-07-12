// lib/shared/inventoryTypes.ts

import type { ItemId } from "../items/itemDefinitions.js";

// lib/shared/inventoryTypes.ts

import type { ArmorKind, WeaponKind } from "../items/itemTypes.js";

export type WeaponUpgradeStats = {
    damage: number;
    crit: number;
    rollPercentage: number;
};

export type WeaponMasteryStats = {
    damage: number;
    crit: number;
};

export type ArmorUpgradeStats = {
    hp: number;
    armor: number;
    rollPercentage: number;
};

export type ArmorMasteryStats = {
    hp: number;
    armor: number;
};

export type WeaponItemInstance = {
    uid: string;
    itemId: string;
    type: "Weapon";
    kind: WeaponKind;

    level: number;
    currentXp: number;
    availableUpgradePoints: number;

    rolledStats: {
        damage: {
            value: number,
            percentage: number,
        },
        crit: {
            value: number,
            percentage: number,
        }
    },

    upgradedStats: {
        damage: {
            value: number,
            percentage: number,
        },
        crit: {
            value: number,
            percentage: number,
        }
    }

    currentUpgradePoints: {
        damage: number,
        crit: number,
    }

    masteryStats: WeaponMasteryStats;

    enchantmentIds: string[];
};

export type ArmorItemInstance = {
    uid: string;
    itemId: string;
    type: "Armor";
    kind: ArmorKind;

    level: number;
    currentXp: number;
    availableUpgradePoints: number;

    rolledStats: {
        hp: {
            value: number,
            percentage: number,
        },
        armor: {
            value: number,
            percentage: number,
        }
    },

    upgradedStats: {
        hp: {
            value: number,
            percentage: number,
        },
        armor: {
            value: number,
            percentage: number,
        }
    }

    currentUpgradePoints: {
        hp: number,
        armor: number,
    }

    masteryStats: ArmorMasteryStats;

    enchantmentIds: string[];
};

export type MaterialItemInstance = {
    uid: string;
    itemId: string;
    type: "Material";
    quantity: number;
};

export type InventoryItemInstance =
    | WeaponItemInstance
    | ArmorItemInstance
    | MaterialItemInstance;

export type ServerInventory = {
    gold: number;

    weapon: WeaponItemInstance | null;

    helmet: ArmorItemInstance | null;
    arms: ArmorItemInstance | null;
    chest: ArmorItemInstance | null;
    legs: ArmorItemInstance | null;

    miscWeapons: (WeaponItemInstance | null)[];
    miscArmor: (ArmorItemInstance | null)[];
    miscMaterial: (MaterialItemInstance | null)[];
};

export type ServerStorage = Pick<
    ServerInventory,
    "miscWeapons" | "miscArmor" | "miscMaterial"
>;
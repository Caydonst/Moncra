// lib/shared/hydrateItem.ts

import { getItemXpRequired } from "../items/itemUpgrading.js";
import { itemDefinitions } from "../items/itemDefinitions.js";

import type {
    ArmorItemInstance,
    InventoryItemInstance,
    MaterialItemInstance,
    WeaponItemInstance,
} from "./inventoryTypes.js";

function hydrateWeapon(instance: WeaponItemInstance) {
    const def = itemDefinitions[instance.itemId];

    if (!def || def.type !== "Weapon") {
        throw new Error(
            `Expected weapon definition for item: ${instance.itemId}`
        );
    }

    return {
        ...def,

        uid: instance.uid,
        level: instance.level,
        currentXp: instance.currentXp,
        nextLvlXp: getItemXpRequired(instance.level),
        availableUpgradePoints: instance.availableUpgradePoints,

        rolledStats: instance.rolledStats,
        upgradedStats: instance.upgradedStats,
        masteryStats: instance.masteryStats,

        enchantmentIds: instance.enchantmentIds,

        currentUpgradePoints: instance.currentUpgradePoints,

        stats: {
            power: def.baseStats.power + instance.level * 2,

            damage:
                instance.upgradedStats.damage.value,

            crit:
                instance.upgradedStats.crit.value
        },
    };
}

function hydrateArmor(instance: ArmorItemInstance) {
    const def = itemDefinitions[instance.itemId];

    if (!def || def.type !== "Armor") {
        throw new Error(
            `Expected armor definition for item: ${instance.itemId}`
        );
    }

    return {
        ...def,

        uid: instance.uid,
        level: instance.level,
        currentXp: instance.currentXp,
        nextLvlXp: getItemXpRequired(instance.level),
        availableUpgradePoints: instance.availableUpgradePoints,

        rolledStats: instance.rolledStats,
        upgradedStats: instance.upgradedStats,
        masteryStats: instance.masteryStats,

        enchantmentIds: instance.enchantmentIds,
        
        currentUpgradePoints: instance.currentUpgradePoints,

        stats: {
            power: def.baseStats.power + instance.level * 2,

            hp:
                instance.upgradedStats.hp.value,

            armor:
                instance.upgradedStats.armor.value
        },
    };
}

function hydrateMaterial(instance: MaterialItemInstance) {
    const def = itemDefinitions[instance.itemId];

    if (!def || def.type !== "Material") {
        throw new Error(
            `Expected material definition for item: ${instance.itemId}`
        );
    }

    return {
        ...def,
        uid: instance.uid,
        quantity: instance.quantity,
    };
}

export function hydrateItem(instance: InventoryItemInstance) {
    switch (instance.type) {
        case "Weapon":
            return hydrateWeapon(instance);

        case "Armor":
            return hydrateArmor(instance);

        case "Material":
            return hydrateMaterial(instance);
    }
}

export function hydrateSlot(item: InventoryItemInstance | null) {
    return item ? hydrateItem(item) : null;
}
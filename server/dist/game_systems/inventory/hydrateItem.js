// lib/shared/hydrateItem.ts
import { getItemXpRequired } from "../items/itemUpgrading.js";
import { itemDefinitions } from "../items/itemDefinitions.js";
function hydrateWeapon(instance) {
    const def = itemDefinitions[instance.itemId];
    if (!def || def.type !== "Weapon") {
        throw new Error(`Expected weapon definition for item: ${instance.itemId}`);
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
            damage: instance.upgradedStats.damage.value,
            crit: instance.upgradedStats.crit.value
        },
    };
}
function hydrateArmor(instance) {
    const def = itemDefinitions[instance.itemId];
    if (!def || def.type !== "Armor") {
        throw new Error(`Expected armor definition for item: ${instance.itemId}`);
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
            hp: instance.upgradedStats.hp.value,
            armor: instance.upgradedStats.armor.value
        },
    };
}
function hydrateMaterial(instance) {
    const def = itemDefinitions[instance.itemId];
    if (!def || def.type !== "Material") {
        throw new Error(`Expected material definition for item: ${instance.itemId}`);
    }
    return {
        ...def,
        uid: instance.uid,
        quantity: instance.quantity,
    };
}
export function hydrateItem(instance) {
    if (!instance) {
        throw new Error("hydrateItem received an undefined item instance.");
    }
    const def = itemDefinitions[instance.itemId];
    if (!def) {
        console.error("Missing item definition", {
            uid: instance.uid,
            itemId: instance.itemId,
            type: instance.type,
            rarity: instance.rarity,
            instance,
        });
        throw new Error(`Unknown item definition: ${instance.itemId}`);
    }
    if (def.type !== instance.type) {
        console.error("Item type mismatch", {
            uid: instance.uid,
            itemId: instance.itemId,
            instanceType: instance.type,
            definitionType: def.type,
        });
        throw new Error(`Item type mismatch for ${instance.itemId}`);
    }
    switch (instance.type) {
        case "Weapon":
            return hydrateWeapon(instance);
        case "Armor":
            return hydrateArmor(instance);
        case "Material":
            return hydrateMaterial(instance);
    }
}
export function hydrateSlot(item) {
    return item ? hydrateItem(item) : null;
}
//# sourceMappingURL=hydrateItem.js.map
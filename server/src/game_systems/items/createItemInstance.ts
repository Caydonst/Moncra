import { randomUUID } from "crypto";
import { itemDefinitions } from "../items/itemDefinitions.js";
import { rollItemStats } from "../items/itemRolls.js";

import type {
    ArmorItemInstance,
    InventoryItemInstance,
    MaterialItemInstance,
    WeaponItemInstance,
} from "../inventory/inventoryTypes.js";

export function createItemInstance(
    itemId: string,
    quantity = 1
): InventoryItemInstance {
    const def = itemDefinitions[itemId];

    if (!def) {
        throw new Error(`Unknown item definition: ${itemId}`);
    }

    if (def.type === "Weapon") {
        const roll = rollItemStats("Weapon", def.rarity);

        if (!roll?.damage || !roll.crit) {
            throw new Error(`Failed to roll weapon stats for ${itemId}`);
        }

        const instance: WeaponItemInstance = {
            uid: randomUUID(),
            itemId: def.id,
            type: "Weapon",
            kind: def.kind,
            rarity: def.rarity,
            level: 3,
            currentXp: 30,
            availableUpgradePoints: 3,
            power: def.baseStats.power,

            rolledStats: {
                damage: {
                    value: roll.damage.value,
                    percentage: roll.damage.percentage,
                },
                crit: {
                    value: roll.crit.value,
                    percentage: roll.crit.percentage,
                }
            },
            upgradedStats: {
                damage: {
                    value: roll.damage.value,
                    percentage: roll.damage.percentage,
                },
                crit: {
                    value: roll.crit.value,
                    percentage: roll.crit.percentage,
                }
            },

            currentUpgradePoints: {
                damage: 0,
                crit: 0,
            },

            masteryStats: {
                damage: {
                    level: 0,
                    value: 0,
                },
                crit: {
                    level: 0,
                    value: 0,
                },
            },

            enchantmentIds: [],
        };

        return instance;
    }

    if (def.type === "Armor") {
        const roll = rollItemStats("Armor", def.rarity);

        if (!roll?.hp || !roll.armor) {
            throw new Error(`Failed to roll armor stats for ${itemId}`);
        }

        const instance: ArmorItemInstance = {
            uid: randomUUID(),
            itemId: def.id,
            type: "Armor",
            kind: def.kind,
            rarity: def.rarity,
            level: 0,
            currentXp: 80,
            availableUpgradePoints: 3,
            power: def.baseStats.power,

            rolledStats: {
                hp: {
                    value: roll.hp.value,
                    percentage: roll.hp.percentage,
                },
                armor: {
                    value: roll.armor.value,
                    percentage: roll.armor.percentage,
                }
            },
            upgradedStats: {
                hp: {
                    value: roll.hp.value,
                    percentage: roll.hp.percentage,
                },
                armor: {
                    value: roll.armor.value,
                    percentage: roll.armor.percentage,
                }
            },

            currentUpgradePoints: {
                hp: 0,
                armor: 0,
            },

            masteryStats: {
                hp: {
                    level: 0,
                    value: 0,
                },
                armor: {
                    level: 0,
                    value: 0,
                },
            },

            enchantmentIds: [],
        };

        return instance;
    }

    if (def.type === "Material") {
        const instance: MaterialItemInstance = {
            uid: randomUUID(),
            itemId: def.id,
            type: "Material",
            quantity,
        };

        return instance;
    }

    throw new Error(`Unsupported item definition: ${itemId}`);
}
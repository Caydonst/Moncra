import { ArmorDefinition, WeaponDefinition } from "./itemTypes.js";

const baseAttack = 100;
const baseHp = 100;
const baseArmor = 20;


const multipliers = {
    common: {
        min: 0.8,
        max: 1.8,
        crit: {
            min: 1,
            max: 5,
        }
    },
    uncommon: {
        min: 1.6,
        max: 2.6,
        crit: {
            min: 4,
            max: 9,
        }
    },
    rare: {
        min: 2.4,
        max: 3.4,
        crit: {
            min: 8,
            max: 13,
        }
    },
    epic: {
        min: 3.2,
        max: 4.2,
        crit: {
            min: 12,
            max: 17,
        }
    },
    legendary: {
        min: 4.0,
        max: 5.0,
        crit: {
            min: 16,
            max: 21,
        }
    },
    exalted: {
        min: 4.8,
        max: 5.8,
        crit: {
            min: 20,
            max: 25,
        }
    },
}

type Rarity = keyof typeof multipliers;
type ItemType = "Weapon" | "Armor";

export function rollItemStats(itemType: ItemType, itemRarity: Rarity) {

    if (itemType === "Weapon") {
        const damage = randomBetween(baseAttack * multipliers[itemRarity].min, baseAttack * multipliers[itemRarity].max);
        const crit = randomBetween(multipliers[itemRarity].crit.min, multipliers[itemRarity].crit.max);

        return {damage, crit};

    } else if (itemType === "Armor") {
        const hp = randomBetween(baseHp * multipliers[itemRarity].min, baseHp * multipliers[itemRarity].max);
        const armor = randomBetween(baseArmor * multipliers[itemRarity].min, baseArmor * multipliers[itemRarity].max);

        return { hp, armor };
    }
}

function randomBetween(min: number, max: number, decimals = 0) {
    const multiplier = 10 ** decimals;

    const scaledMin = Math.ceil(min * multiplier);
    const scaledMax = Math.floor(max * multiplier);

    const value =
        Math.floor(
            Math.random() * (scaledMax - scaledMin + 1)
        ) + scaledMin;

    const rolledValue = value / multiplier;

    const percentage =
        ((rolledValue - min) / (max - min)) * 100;

    return {
        value: rolledValue,
        percentage: Math.round(percentage)
    };
}

type UpgradeStat = "damage" | "crit" | "hp" | "armor";

export function getMaxStatValue(
    rarity: keyof typeof multipliers,
    stat: UpgradeStat
): number {
    const rarityMultiplier = multipliers[rarity];

    switch (stat) {
        case "damage":
            return Math.round(baseAttack * rarityMultiplier.max);

        case "hp":
            return Math.round(baseHp * rarityMultiplier.max);

        case "armor":
            return Math.round(baseArmor * rarityMultiplier.max);

        case "crit":
            return rarityMultiplier.crit.max;
    }
}

export function getMinStatValue(
    rarity: keyof typeof multipliers,
    stat: UpgradeStat
): number {
    const rarityMultiplier = multipliers[rarity];

    switch (stat) {
        case "damage":
            return Math.round(
                baseAttack * rarityMultiplier.min
            );

        case "hp":
            return Math.round(
                baseHp * rarityMultiplier.min
            );

        case "armor":
            return Math.round(
                baseArmor * rarityMultiplier.min
            );

        case "crit":
            return rarityMultiplier.crit.min;
    }
}
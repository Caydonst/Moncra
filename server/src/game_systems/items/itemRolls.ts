import { ArmorDefinition, WeaponDefinition } from "./itemTypes.js";

const baseAttack = 100;
const baseHp = 100;
const baseArmor = 20;


const multipliers = {
    common: {
        min: 0.8,
        max: 1.0,
        crit: {
            min: 5,
            max: 7,
        }
    },
    uncommon: {
        min: 0.95,
        max: 1.2,
        crit: {
            min: 6,
            max: 9,
        }
    },
    rare: {
        min: 1.15,
        max: 1.45,
        crit: {
            min: 8,
            max: 12,
        }
    },
    epic: {
        min: 1.40,
        max: 1.75,
        crit: {
            min: 11,
            max: 16,
        }
    },
    legendary: {
        min: 1.70,
        max: 2.15,
        crit: {
            min: 15,
            max: 22,
        }
    },
    exalted: {
        min: 2.10,
        max: 2.70,
        crit: {
            min: 21,
            max: 30,
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
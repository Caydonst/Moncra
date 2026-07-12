import type {
    ArmorItemInstance,
    MaterialItemInstance,
    ServerInventory,
    WeaponItemInstance,
} from "./inventoryTypes.js";

import { createItemInstance } from "../items/createItemInstance.js";

function createWeapon(itemId: string): WeaponItemInstance {
    const item = createItemInstance(itemId);

    if (item.type !== "Weapon") {
        throw new Error(`${itemId} is not a weapon`);
    }

    return item;
}

function createArmor(itemId: string): ArmorItemInstance {
    const item = createItemInstance(itemId);

    if (item.type !== "Armor") {
        throw new Error(`${itemId} is not armor`);
    }

    return item;
}

function createMaterial(
    itemId: string,
    quantity: number
): MaterialItemInstance {
    const item = createItemInstance(itemId, quantity);

    if (item.type !== "Material") {
        throw new Error(`${itemId} is not a material`);
    }

    return item;
}

export function createStartingInventory(): ServerInventory {
    return {
        gold: 100000,

        weapon: null,
        helmet: null,
        arms: null,
        chest: null,
        legs: null,

        miscWeapons: [
            createWeapon("great_sword0"),
            createWeapon("great_sword1"),
            createWeapon("great_sword1"),
            createWeapon("great_sword0"),
            createWeapon("great_sword2"),
            createWeapon("great_sword3"),

            ...Array<WeaponItemInstance | null>(10).fill(null),
        ],

        miscArmor: [
            createArmor("iron_helmet"),
            createArmor("iron_arms"),
            createArmor("iron_chest"),
            createArmor("iron_legs"),

            createArmor("iron_legs"),
            createArmor("iron_legs"),
            createArmor("iron_legs"),

            createArmor("iron_chest"),
            createArmor("iron_chest"),
            createArmor("iron_chest"),
            createArmor("iron_chest"),

            createArmor("iron_arms"),
            createArmor("iron_arms"),
            createArmor("iron_arms"),

            createArmor("iron_helmet"),
            createArmor("iron_helmet"),
            createArmor("iron_helmet"),
            createArmor("iron_helmet"),
            createArmor("iron_helmet"),
            createArmor("iron_helmet"),
            createArmor("iron_helmet"),

            ...Array<ArmorItemInstance | null>(8).fill(null),
        ],

        miscMaterial: [
            createMaterial("infernal_fragment", 5),

            ...Array<MaterialItemInstance | null>(11).fill(null),
        ],
    };
}
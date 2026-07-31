import type {
    ArmorItemInstance,
    LanternItemInstance,
    MaterialItemInstance,
    ServerInventory,
    WeaponItemInstance,
} from "./inventoryTypes.js";

import { createItemInstance } from "../items/createItemInstance.js";

import type { ItemId } from "../items/itemDefinitions.js";

function createWeapon(itemId: ItemId): WeaponItemInstance {
    const item = createItemInstance(itemId);

    if (item.type !== "Weapon") {
        throw new Error(`${itemId} is not a weapon`);
    }

    return item;
}

function createArmor(itemId: ItemId): ArmorItemInstance {
    const item = createItemInstance(itemId);

    if (item.type !== "Armor") {
        throw new Error(`${itemId} is not armor`);
    }

    return item;
}

function createMaterial(
    itemId: ItemId,
    quantity: number
): MaterialItemInstance {
    const item = createItemInstance(itemId, quantity);

    if (item.type !== "Material") {
        throw new Error(`${itemId} is not a material`);
    }

    return item;
}

function createLantern(itemId: ItemId): LanternItemInstance {
    const item = createItemInstance(itemId);

    if (item.type !== "Lantern") {
        throw new Error(`${itemId} is not a lantern`);
    }

    return item;
}

export function createStartingInventory(): ServerInventory {
    return {
        gold: 100000,

        weapon: createWeapon("great_sword0"),
        lantern: createLantern("lantern"),
        helmet: createArmor("iron_helmet"),
        arms: createArmor("iron_arms"),
        chest: createArmor("iron_chest"),
        legs: createArmor("iron_legs"),

        miscWeapons: [
            createWeapon("great_sword0"),
            createWeapon("great_sword1"),
            createWeapon("great_sword1"),
            createWeapon("great_sword0"),
            createWeapon("great_sword2"),
            createWeapon("great_sword3"),
        ],

        miscArmor: [
            createArmor("iron_helmet"),
            createArmor("iron_arms"),
            createArmor("iron_chest"),
            createArmor("iron_legs"),

            createArmor("iron_legs"),
            createArmor("iron_legs"),
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
        ],

        miscMaterial: [
            createMaterial("infernal_fragment", 5),

            ...Array<MaterialItemInstance | null>(11).fill(null),
        ],
    };
}
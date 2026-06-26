// lib/shared/itemDefinitions.ts

import type { ItemDefinition } from "./itemTypes";

export const itemDefinitions = {
    great_sword0: {
        id: "great_sword0",
        name: "Stone Sword",
        type: "Weapon",
        kind: "Great Sword",
        specialization: {
            name: "Executioner",
            icon: "/icons/executioner_icon.png"
        },
        icon: "/weapons/great_sword/stone_sword.png",
        rarity: "common",
        attackStyle: "Melee",
        baseStats: {
            power: 10,
            damage: 10,
        },
        maxLevel: 10,
        enchantmentIds: [],
    },

    great_sword1: {
        id: "great_sword1",
        name: "Sword",
        type: "Weapon",
        kind: "Great Sword",
        specialization: {
            name: "Sentinel",
            icon: "/icons/sentinel_icon.png"
        },
        icon: "/weapons/great_sword/forged.png",
        rarity: "legendary",
        attackStyle: "Melee",
        baseStats: {
            power: 130,
            damage: 40,
        },
        maxLevel: 10,
        enchantmentIds: ["critical_hit", "chain_lightning"],
    },

    obsidian_armor: {
        id: "obsidian_armor",
        name: "Obsidian Armor",
        type: "Armor",
        icon: "/armor/obsidian_armor.png",
        rarity: "exalted",
        baseStats: {
            hp: 50,
            defense: 15,
            power: 130,
        },
        maxLevel: 10,
        enchantmentIds: [],
    },

    infernal_fragment: {
        id: "infernal_fragment",
        name: "Infernal Fragment",
        type: "Material",
        icon: "/currency/test_material.png",
        rarity: "epic",
    },
} as const satisfies Record<string, ItemDefinition>;

export type ItemId = keyof typeof itemDefinitions;
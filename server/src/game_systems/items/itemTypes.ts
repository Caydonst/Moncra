// lib/shared/itemTypes.ts

export const rarities = ["common", "rare", "epic", "legendary", "exalted"] as const;
export type Rarity = typeof rarities[number];

export type Specialization = {
    name: "Duelist" | "Executioner" | "Sentinel",
    icon: string;
};

export type WeaponKind = "Great Sword" | "Bow" | "War Hammer";

export type ItemDefinition =
    | WeaponDefinition
    | ArmorDefinition
    | MaterialDefinition;

export type WeaponDefinition = {
    id: string;
    name: string;
    type: "Weapon";
    kind: WeaponKind;
    specialization: Specialization;
    icon: string;
    rarity: Rarity;
    attackStyle: "Melee" | "Ranged";
    baseStats: {
        power: number;
        damage: number;
    };
    maxLevel: number;
    enchantmentIds: string[];
};

export type ArmorDefinition = {
    id: string;
    name: string;
    type: "Armor";
    kind: "helmet" | "arms" | "chest" | "legs";
    icon: string;
    rarity: Rarity;
    baseStats: {
        hp: number;
        defense: number;
        power: number;
    };
    maxLevel: number;
    enchantmentIds: string[];
};

export type MaterialDefinition = {
    id: string;
    name: string;
    type: "Material";
    icon: string;
    rarity: Rarity;
};
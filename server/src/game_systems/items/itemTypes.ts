// lib/shared/itemTypes.ts

export const rarities = ["common", "rare", "epic", "legendary", "exalted"] as const;
export type Rarity = typeof rarities[number];

export type Specialization = {
    name: "Duelist" | "Executioner" | "Sentinel",
    icon: string;
};

export type WeaponKind = "Great Sword" | "Bow" | "War Hammer";
export type ArmorKind = "helmet" | "arms" | "chest" | "legs";

export type ItemDefinition =
    | WeaponDefinition
    | ArmorDefinition
    | MaterialDefinition;

type weaponUpgradedStats = {
    damage: number;
    crit: number;
    damagePoints: number;
    critPoints: number;
}

type armorUpgradedStats = {
    hp: number;
    armor: number;
    hpPoints: number;
    armorPoints: number;
}

type weaponMasteryStats = {
    damage: number;
    crit: number;
}

type armorMasteryStats = {
    hp: number;
    armor: number;
}

/*
export type WeaponDefinition = {
    id: string;
    name: string;
    type: "Weapon";
    kind: WeaponKind;
    icon: string;
    rarity: Rarity;
    attackStyle: "Melee" | "Ranged";
    baseStats: {
        power: number;
        damage: number;
        crit: number;
    };
    upgradedStats: {
        damage: {
            level: number;
            value: number;
        }
        crit: {
            level: number;
            value: number;
        }
    };
    masteryStats: {
        damage: {
            level: number;
            value: number;
        }
        crit: {
            level: number;
            value: number;
        }
    }
    maxLevel: number;
    level: number;
    currentXp: number;
    nextLvlXp: number;
    upgradePoints: number;
    enchantmentIds: string[];
};
*/

export type WeaponDefinition = {
    id: string;
    name: string;
    type: "Weapon";
    kind: WeaponKind;
    icon: string;
    rarity: Rarity;
    attackStyle: "Melee" | "Ranged";

    baseStats: {
        power: number;
        damage: number;
        crit: number;
    };
    maxLevel: number;
    enchantmentIds: string[];
};

export type ArmorDefinition = {
    id: string;
    name: string;
    type: "Armor";
    kind: ArmorKind;
    icon: string;
    rarity: Rarity;
    baseStats: {
        hp: number;
        armor: number;
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
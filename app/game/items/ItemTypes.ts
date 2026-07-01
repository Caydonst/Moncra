
export type ItemSlot = "weapon" | "armor" | "misc";
import * as ex from 'excalibur'
import type { Enchantment } from "../enchantments/enchantments"

export const rarities = [
    "common",
    "rare",
    "epic",
    "legendary",
    "exalted"
] as const;

export type Rarity = typeof rarities[number];

export type Item = {
    id: string;
    name: string;
    type: "weapon" | "armor" | "misc";
    icon: string; // URL to image
    rarity: Rarity
    attackStyle: "Ranged" | "Melee"
    stats?: any;
    level?: number;
    maxLevel?: number;

    createWeapon?: () => ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    };

    instance?: ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    }
};

type Specialization = {
    name: "Duelist" | "Executioner" | "Sentinel";
    icon: string;
}

export type Weapon = {
    uid: string;
    name: string;
    type: "Weapon";
    kind: "Great Sword" | "Bow";
    specialization: Specialization;
    icon: string; // URL to image
    rarity: Rarity
    stats?: any;
    level: number;
    maxLevel: number;
    enchantments?: Enchantment[];

    createWeapon?: () => ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    };

    instance?: ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    }
}

export type Armor = {
    uid: string,
    name: string,
    type: "Armor",
    kind: "helmet" | "arms" | "chest" | "legs",
    rarity: Rarity,
    icon: string;
    gameIcon: any,
    stats?: any;
    level: number;
    maxLevel: number;
    enchantments?: Enchantment[];
}


export type Material = {
    uid: string,
    name: string,
    type: "Material",
    rarity: Rarity, 
    quantity: number,
    icon: string;
    gameIcon: any;
}

export type Ammunition = {
    id: string;
    name: string;
    type: "rifle" | "pistol" | "smg" | "shotgun";
    icon: string;
    rarity: "common"
    amount: number;
    maxAmount: number;
}

export const equippableItems = ["Weapon", "Armor"];

export type InventoryItem = Item;

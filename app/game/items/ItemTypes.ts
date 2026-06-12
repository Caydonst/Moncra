import {WarHammer} from "../weapons/warhammer"
import {Bow} from "../weapons/bow"
import {GreatSword} from "../weapons/sword"
import {Player} from "../player/player"
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
    weapon?: GreatSword | WarHammer | Bow;

    createWeapon?: () => ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    };

    instance?: ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    }
};

export type Weapon = {
    id: string;
    name: string;
    type: "Great Sword" | "Bow";
    icon: string; // URL to image
    rarity: Rarity
    attackStyle: "Ranged" | "Melee"
    stats?: any;
    level: number;
    maxLevel: number;
    enchantments?: Enchantment[]
    weapon?: Bow;

    createWeapon?: () => ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    };

    instance?: ex.Actor & {
        addListeners?: () => void;
        cleanup?: () => void;
    }
}

export type Material = {
    id: string,
    name: string,
    rarity: Rarity,
    icon: string;
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

export const equippableItems = ["Great Sword", "Bow", "Armor"];

export type InventoryItem = Item;

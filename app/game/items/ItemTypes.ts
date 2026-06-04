import {WarHammer} from "../weapons/warhammer"
import {Bow} from "../weapons/bow"
import {GreatSword} from "../weapons/sword"
import {Player} from "../player/player"
export type ItemSlot = "weapon" | "armor" | "misc";
import * as ex from 'excalibur'
import type { Enchantment } from "../enchantments/enchantments"

export type Item = {
    id: string;
    name: string;
    type: "weapon" | "armor" | "misc";
    icon: string; // URL to image
    rarity: "tempered" | "runed" | "exalted" | "ascendant" | "mythic" | "relic";
    attackStyle: "Ranged" | "Melee"
    stats?: any;
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
    rarity: "tempered" | "runed" | "exalted" | "ascendant" | "mythic" | "relic";
    attackStyle: "Ranged" | "Melee"
    stats?: any;
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

import {WarHammer} from "../weapons/warhammer"
import {Bow} from "../weapons/bow"
import {GreatSword} from "../weapons/sword"
import {Player} from "../player"
export type ItemSlot = "weapon" | "armor" | "misc";
import * as ex from 'excalibur'

export type Item = {
    id: string;
    name: string;
    type: "weapon" | "armor" | "misc";
    icon: string; // URL to image
    rarity: "common" | "rare" | "epic" | "legendary" | "artifact";
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
    type: "rifle" | "pistol" | "greatsword" | "bow";
    icon: string; // URL to image
    rarity: "common" | "rare" | "epic" | "legendary" | "artifact";
    stats?: any;
    weapon?: Bow;
    magazine: Ammunition | null;

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

/*
export interface BaseItem {
    id: string;               // unique ID
    name: string;
    icon: string;             // image source
    type: ItemSlot;
}

export interface WeaponItem extends BaseItem {
    type: "weapon";
    damage: number;
}

export interface ArmorItem extends BaseItem {
    type: "armor";
    defense: number;
}

export interface MiscItem extends BaseItem {
    type: "misc";
    description: string;
}
*/

export type InventoryItem = Item;

// lib/shared/hydrateInventory.ts

import {
    hydrateItem,
    hydrateSlot,
} from "./hydrateItem.js";

import type { ServerInventory } from "./inventoryTypes.js";

export type HydratedItem = NonNullable<
    ReturnType<typeof hydrateItem>
>;

export type HydratedWeapon = Extract<
    HydratedItem,
    { type: "Weapon" }
>;

export type HydratedArmor = Extract<
    HydratedItem,
    { type: "Armor" }
>;

export type HydratedMaterial = Extract<
    HydratedItem,
    { type: "Material" }
>;

export type HydratedInventory = {
    gold: number;

    weapon: HydratedWeapon | null;

    helmet: HydratedArmor | null;
    arms: HydratedArmor | null;
    chest: HydratedArmor | null;
    legs: HydratedArmor | null;

    miscWeapons: (HydratedWeapon | null)[];
    miscArmor: (HydratedArmor | null)[];
    miscMaterial: (HydratedMaterial | null)[];
};

export function hydrateInventory(
    inventory: ServerInventory
): HydratedInventory {
    return {
        gold: inventory.gold,

        weapon: inventory.weapon
            ? (hydrateItem(inventory.weapon) as HydratedWeapon)
            : null,

        helmet: inventory.helmet
            ? (hydrateItem(inventory.helmet) as HydratedArmor)
            : null,

        arms: inventory.arms
            ? (hydrateItem(inventory.arms) as HydratedArmor)
            : null,

        chest: inventory.chest
            ? (hydrateItem(inventory.chest) as HydratedArmor)
            : null,

        legs: inventory.legs
            ? (hydrateItem(inventory.legs) as HydratedArmor)
            : null,

        miscWeapons: inventory.miscWeapons.map((item) =>
            item
                ? (hydrateItem(item) as HydratedWeapon)
                : null
        ),

        miscArmor: inventory.miscArmor.map((item) =>
            item
                ? (hydrateItem(item) as HydratedArmor)
                : null
        ),

        miscMaterial: inventory.miscMaterial.map((item) =>
            item
                ? (hydrateItem(item) as HydratedMaterial)
                : null
        ),
    };
}
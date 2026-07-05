// lib/shared/inventoryTypes.ts

import type { ItemId } from "../items/itemDefinitions.js";

export type InventoryItemInstance = {
    uid: string;
    itemId: ItemId;
    kind?: string;
    level?: number;
    quantity?: number;
};

export type ServerInventory = {
    gold: number;
    weapon: InventoryItemInstance | null;
    helmet: InventoryItemInstance | null;
    chest: InventoryItemInstance | null;
    arms: InventoryItemInstance | null;
    legs: InventoryItemInstance | null;
    miscWeapons: (InventoryItemInstance | null)[];
    miscArmor: (InventoryItemInstance | null)[];
    miscMaterial: (InventoryItemInstance | null)[];
};

export type ServerStorage = Pick<
    ServerInventory,
    "miscWeapons" | "miscArmor" | "miscMaterial"
>;
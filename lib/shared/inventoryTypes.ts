// lib/shared/inventoryTypes.ts

import type { ItemId } from "./itemDefinitions";

export type InventoryItemInstance = {
    uid: string;
    itemId: ItemId;
    level: number;
    quantity?: number;
};

export type ServerInventory = {
    gold: number;
    weapon: InventoryItemInstance | null;
    armor: InventoryItemInstance | null;
    miscWeapons: (InventoryItemInstance | null)[];
    miscArmor: (InventoryItemInstance | null)[];
    miscMaterial: (InventoryItemInstance | null)[];
};
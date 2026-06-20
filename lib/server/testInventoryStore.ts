import { randomUUID } from "crypto";
import type { ServerInventory } from "@/lib/shared/inventoryTypes";

let inventory: ServerInventory | null = null;

export function getTestInventory(): ServerInventory {
    if (!inventory) {
        inventory = {
            gold: 100000,
            weapon: null,
            armor: null,
            miscWeapons: Array(12).fill(null),
            miscArmor: Array(12).fill(null),
            miscMaterial: Array(12).fill(null),
        };

        inventory.miscWeapons[0] = {
            uid: randomUUID(),
            itemId: "great_sword0",
            level: 0,
        };

        inventory.miscWeapons[1] = {
            uid: randomUUID(),
            itemId: "great_sword1",
            level: 0,
        };

        inventory.miscArmor[0] = {
            uid: randomUUID(),
            itemId: "obsidian_armor",
            level: 0,
        };

        inventory.miscMaterial[0] = {
            uid: randomUUID(),
            itemId: "infernal_fragment",
            quantity: 5,
        };
    }

    return inventory;
}
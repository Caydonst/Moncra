import { randomUUID } from "crypto";
import type { ServerInventory } from "@/lib/shared/inventoryTypes";

let inventory: ServerInventory | null = null;

export function getTestInventory(): ServerInventory {
    if (!inventory) {
        inventory = {
            gold: 100000,
            weapon: null,
            helmet: null,
            arms: null,
            chest: null,
            legs: null,
            miscWeapons: Array(12).fill(null),
            miscArmor: Array(12).fill(null),
            miscMaterial: Array(12).fill(null),
        };

        inventory.miscWeapons[0] = {
            uid: randomUUID(),
            itemId: "great_sword0",
            kind: "Great Sword",
            level: 0,
        };

        inventory.miscWeapons[1] = {
            uid: randomUUID(),
            itemId: "great_sword1",
            kind: "Great Sword",
            level: 0,
        };

        inventory.miscArmor[0] = {
            uid: randomUUID(),
            itemId: "iron_helmet",
            kind: "helmet",
            level: 0,
        };

        inventory.miscArmor[1] = {
            uid: randomUUID(),
            itemId: "iron_arms",
            kind: "arms",
            level: 0,
        };

        inventory.miscArmor[2] = {
            uid: randomUUID(),
            itemId: "iron_chest",
            kind: "chest",
            level: 0,
        };

        inventory.miscArmor[3] = {
            uid: randomUUID(),
            itemId: "iron_legs",
            kind: "legs",
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
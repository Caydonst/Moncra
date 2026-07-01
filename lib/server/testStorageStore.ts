// server/storage.ts or lib/server/storage.ts

import { randomUUID } from "crypto";
import type { ServerStorage } from "@/lib/shared/inventoryTypes";

let storage: ServerStorage | null = null;

export function getTestStorage(): ServerStorage {
    if (!storage) {
        storage = {
            miscWeapons: Array(12).fill(null),
            miscArmor: Array(12).fill(null),
            miscMaterial: Array(12).fill(null),
        };

        storage.miscWeapons[0] = {
            uid: randomUUID(),
            itemId: "great_sword0",
            level: 0,
        };

        storage.miscArmor[0] = {
            uid: randomUUID(),
            itemId: "iron_helmet",
            level: 0,
        };

        storage.miscMaterial[0] = {
            uid: randomUUID(),
            itemId: "infernal_fragment",
            level: 0,
            quantity: 20,
        };
    }

    return storage;
}
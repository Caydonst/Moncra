// lib/shared/hydrateStorage.ts

import { hydrateSlot } from "./hydrateItem.js";
import type { ServerStorage } from "./inventoryTypes.js";

export function hydrateStorage(storage: ServerStorage) {
    return {
        miscWeapons: storage.miscWeapons.map(hydrateSlot),
        miscArmor: storage.miscArmor.map(hydrateSlot),
        miscMaterial: storage.miscMaterial.map(hydrateSlot),
    };
}
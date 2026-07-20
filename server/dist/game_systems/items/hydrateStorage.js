// lib/shared/hydrateStorage.ts
import { hydrateSlot } from "../inventory/hydrateItem.js";
export function hydrateStorage(storage) {
    return {
        miscWeapons: storage.miscWeapons.map(hydrateSlot),
        miscArmor: storage.miscArmor.map(hydrateSlot),
        miscMaterial: storage.miscMaterial.map(hydrateSlot),
    };
}
//# sourceMappingURL=hydrateStorage.js.map
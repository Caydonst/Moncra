// app/api/transfer-storage-item/route.ts

import { getTestInventory } from "@/lib/server/testInventoryStore";
import { getTestStorage } from "@/lib/server/testStorageStore";
import { hydrateInventory } from "@/lib/shared/hydrateInventory";
import { hydrateStorage } from "@/lib/shared/hydrateStorage";
import type { InventoryItemInstance } from "@/lib/shared/inventoryTypes";

type ItemKind = "weapon" | "armor" | "material";
type Direction = "inventory-to-storage" | "storage-to-inventory";

function getSlots(container: any, kind: ItemKind): (InventoryItemInstance | null)[] {
    if (kind === "weapon") return container.miscWeapons;
    if (kind === "armor") return container.miscArmor;
    return container.miscMaterial;
}

export async function POST(req: Request) {
    try {
        const { uid, kind, direction } = await req.json() as {
            uid: string;
            kind: ItemKind;
            direction: Direction;
        };

        const inventory = getTestInventory();
        const storage = getTestStorage();

        const fromContainer =
            direction === "inventory-to-storage" ? inventory : storage;

        const toContainer =
            direction === "inventory-to-storage" ? storage : inventory;

        const fromSlots = getSlots(fromContainer, kind);
        const toSlots = getSlots(toContainer, kind);

        const fromIndex = fromSlots.findIndex(item => item?.uid === uid);
        if (fromIndex === -1) {
            return Response.json({ error: "Item not found" }, { status: 404 });
        }

        const toIndex = toSlots.findIndex(item => item === null);
        if (toIndex === -1) {
            return Response.json({ error: "No open slot" }, { status: 400 });
        }

        const item = fromSlots[fromIndex];

        fromSlots[fromIndex] = null;
        toSlots[toIndex] = item;

        return Response.json({
            inventory: hydrateInventory(inventory),
            storage: hydrateStorage(storage),
        });
    } catch (error) {
        console.error("Transfer storage item error:", error);

        return Response.json(
            { error: "Failed to transfer item" },
            { status: 500 }
        );
    }
}
// app/api/equip-item/route.ts

import { getTestInventory } from "@/lib/server/testInventoryStore";
import { hydrateInventory } from "@/lib/shared/hydrateInventory";
import { equipItem } from "@/lib/server/inventory/equipItem";

export async function POST(req: Request) {
    const { uid } = await req.json();

    if (!uid) {
        return Response.json({ error: "Missing item uid" }, { status: 400 });
    }

    const inventory = getTestInventory();

    const equipped = equipItem(inventory, uid);

    if (!equipped) {
        return Response.json({ error: "Item not found" }, { status: 404 });
    }

    return Response.json({
        inventory: hydrateInventory(inventory),
    });
}
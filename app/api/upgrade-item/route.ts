// app/api/upgrade-item/route.ts

import { getTestInventory } from "@/lib/server/testInventoryStore";
import { hydrateInventory } from "@/lib/shared/hydrateInventory";
import { hydrateItem, hydrateSlot } from "@/lib/shared/hydrateItem";
import { itemDefinitions } from "@/lib/shared/itemDefinitions";

export async function POST(req: Request) {
    const { uid } = await req.json();

    console.log("UID", uid)

    const inventory = getTestInventory();

    const allItems = [
        inventory.weapon,
        inventory.armor,
        ...inventory.miscWeapons,
        ...inventory.miscArmor,
        ...inventory.miscMaterial,
    ].filter(Boolean);

    console.log(inventory.weapon)

    const item = allItems.find(item => item!.uid === uid);

    if (!item) {
        return Response.json({ error: "Item not found" }, { status: 404 });
    }

    const def = itemDefinitions[item.itemId];

    if (item.level >= def.maxLevel) {
        return Response.json({ error: "Max level" }, { status: 400 });
    }

    const goldCost = 100 * (item.level + 1);

    if (inventory.gold < goldCost) {
        return Response.json({ error: "Not enough gold" }, { status: 400 });
    }

    inventory.gold -= goldCost;
    item.level += 1;

    return Response.json({
        upgradedItem: hydrateItem(item),
        inventory: hydrateInventory(inventory),
    });
}
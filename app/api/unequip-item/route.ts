// app/api/unequip-item/route.ts

import { getTestInventory } from "@/lib/server/testInventoryStore";
import { hydrateInventory } from "@/lib/shared/hydrateInventory";

export async function POST(req: Request) {
    const { slot } = await req.json();

    const inventory = getTestInventory();

    if (slot === "weapon") {
        if (!inventory.weapon) {
            return Response.json({ error: "No weapon equipped" }, { status: 400 });
        }

        const openIndex = inventory.miscWeapons.findIndex(item => item === null);

        if (openIndex === -1) {
            return Response.json({ error: "No open weapon slot" }, { status: 400 });
        }

        inventory.miscWeapons[openIndex] = inventory.weapon;
        inventory.weapon = null;

        return Response.json({ inventory: hydrateInventory(inventory) });
    }

    if (slot === "armor") {
        if (!inventory.armor) {
            return Response.json({ error: "No armor equipped" }, { status: 400 });
        }

        const openIndex = inventory.miscArmor.findIndex(item => item === null);

        if (openIndex === -1) {
            return Response.json({ error: "No open armor slot" }, { status: 400 });
        }

        inventory.miscArmor[openIndex] = inventory.armor;
        inventory.armor = null;

        return Response.json({ inventory: hydrateInventory(inventory) });
    }

    return Response.json({ error: "Invalid slot" }, { status: 400 });
}
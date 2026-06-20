import { getTestInventory } from "@/lib/server/testInventoryStore";
import { hydrateItem } from "@/lib/shared/hydrateItem";

function hydrateSlot(item: any) {
    return item ? hydrateItem(item) : null;
}

export async function GET() {
    try {
        const inventory = getTestInventory();

        return Response.json({
            inventory: {
                gold: inventory.gold,
                weapon: hydrateSlot(inventory.weapon),
                armor: hydrateSlot(inventory.armor),
                miscWeapons: inventory.miscWeapons.map(hydrateSlot),
                miscArmor: inventory.miscArmor.map(hydrateSlot),
                miscMaterial: inventory.miscMaterial.map(hydrateSlot),
            },
        });
    } catch (error) {
        console.error("Inventory API error:", error);

        return Response.json(
            { error: "Failed to load inventory" },
            { status: 500 }
        );
    }
}
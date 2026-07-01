import { getTestInventory } from "@/lib/server/testInventoryStore";
import { getTestStorage } from "@/lib/server/testStorageStore";
import { hydrateInventory } from "@/lib/shared/hydrateInventory";
import { hydrateStorage } from "@/lib/shared/hydrateStorage";

export async function GET() {
    try {
        return Response.json({
            inventory: hydrateInventory(getTestInventory()),
            storage: hydrateStorage(getTestStorage()),
        });
    } catch (error) {
        console.error("Inventory API error:", error);

        return Response.json(
            { error: "Failed to load inventory" },
            { status: 500 }
        );
    }
}
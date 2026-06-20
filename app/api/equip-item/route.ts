// app/api/equip-item/route.ts

import { getTestInventory } from "@/lib/server/testInventoryStore";
import { hydrateInventory } from "@/lib/shared/hydrateInventory";
import { itemDefinitions } from "@/lib/shared/itemDefinitions";

export async function POST(req: Request) {
    const { uid } = await req.json();

    const inventory = getTestInventory();

    const weaponIndex = inventory.miscWeapons.findIndex(item => item?.uid === uid);
    const armorIndex = inventory.miscArmor.findIndex(item => item?.uid === uid);

    console.log(
        weaponIndex
    )
    console.log(
        armorIndex
    )

    if (weaponIndex !== -1) {
        const newWeapon = inventory.miscWeapons[weaponIndex]!;
        const oldWeapon = inventory.weapon;

        inventory.weapon = newWeapon;
        inventory.miscWeapons[weaponIndex] = oldWeapon;

        return Response.json({ inventory: hydrateInventory(inventory) });
    }

    console.log("BEFORE EQUIP", inventory.weapon);

    if (armorIndex !== -1) {
        const newArmor = inventory.miscArmor[armorIndex];
        const oldArmor = inventory.armor;

        inventory.armor = newArmor;
        inventory.miscArmor[armorIndex] = oldArmor;

        return Response.json({
            inventory: hydrateInventory(inventory),
        });
    }

    console.log("AFTER EQUIP", inventory.weapon);
    return Response.json({ error: "Item not found" }, { status: 404 });
}
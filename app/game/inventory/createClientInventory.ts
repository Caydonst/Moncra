import { Inventory } from "@/app/game/inventory/inventory";
import { itemDefinitions } from "@/lib/shared/itemDefinitions";
import { createWeaponFactory } from "@/app/game/items/createWeaponFactory";
import { Armor } from "@/app/game/armor/armor";

export function createClientInventory(serverInventory: any, gameState: any) {
    const inv = new Inventory();

    inv.gold = serverInventory.gold;

    inv.weapon = serverInventory.weapon
        ? hydrateClientItem(serverInventory.weapon, gameState)
        : null;

    inv.armor = serverInventory.armor
        ? hydrateClientItem(serverInventory.armor, gameState)
        : null;

    inv.miscWeapons = serverInventory.miscWeapons.map((slot: any) =>
        slot ? hydrateClientItem(slot, gameState) : null
    );

    inv.miscArmor = serverInventory.miscArmor.map((slot: any) =>
        slot ? hydrateClientItem(slot, gameState) : null
    );

    inv.miscMaterial = serverInventory.miscMaterial.map((slot: any) =>
        slot ? hydrateClientItem(slot, gameState) : null
    );

    return inv;
}

function hydrateClientItem(item: any, gameState: any) {

    if (item.type === "Weapon") {
        return {
            ...item,
            createWeapon: () => createWeaponFactory(item, gameState),
        };
    }

    if (item.type === "Armor") {
        return new Armor({
            ...item,
            stats: item.stats,
        });
    }

    if (item.type === "Material") {
        return item;
    }

    return item;
}
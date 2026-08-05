import { Inventory } from "@/app/game/inventory/inventory";
import { createWeaponFactory } from "@/app/game/items/createWeaponFactory";

export function createClientInventory(
    serverInventory: any,
    gameState: any
) {
    /*
     * Save the current client-only weapon actor before
     * hydrating the server inventory.
     */
    const previousWeapon =
        gameState.inventory?.weapon;

    const previousWeaponInstance =
        previousWeapon?.instance;

    const inv = new Inventory();

    inv.gold = serverInventory.gold;

    inv.weapon = serverInventory.weapon
        ? hydrateClientItem(
            serverInventory.weapon,
            gameState
        )
        : null;

    /*
     * The server does not send Excalibur actors.
     * Restore the existing actor when this is still the
     * same equipped item.
     */
    if (
        inv.weapon &&
        previousWeapon &&
        previousWeaponInstance &&
        !previousWeaponInstance.isKilled() &&
        inv.weapon.uid === previousWeapon.uid
    ) {
        inv.weapon.instance =
            previousWeaponInstance;
    }

    inv.lantern = serverInventory.lantern
        ? hydrateClientItem(
            serverInventory.lantern,
            gameState
        )
        : null;

    inv.helmet = serverInventory.helmet
        ? hydrateClientItem(
            serverInventory.helmet,
            gameState
        )
        : null;

    inv.arms = serverInventory.arms
        ? hydrateClientItem(
            serverInventory.arms,
            gameState
        )
        : null;

    inv.chest = serverInventory.chest
        ? hydrateClientItem(
            serverInventory.chest,
            gameState
        )
        : null;

    inv.legs = serverInventory.legs
        ? hydrateClientItem(
            serverInventory.legs,
            gameState
        )
        : null;

    inv.miscWeapons =
        serverInventory.miscWeapons.map(
            (slot: any) =>
                slot
                    ? hydrateClientItem(
                        slot,
                        gameState
                    )
                    : null
        );

    inv.miscArmor =
        serverInventory.miscArmor.map(
            (slot: any) =>
                slot
                    ? hydrateClientItem(
                        slot,
                        gameState
                    )
                    : null
        );

    inv.miscMaterial =
        serverInventory.miscMaterial.map(
            (slot: any) =>
                slot
                    ? hydrateClientItem(
                        slot,
                        gameState
                    )
                    : null
        );

    return inv;
}

function hydrateClientItem(
    item: any,
    gameState: any
) {
    if (item.type === "Weapon") {
        return {
            ...item,

            createWeapon: () =>
                createWeaponFactory(
                    item,
                    gameState
                ),
        };
    }

    return item;
}
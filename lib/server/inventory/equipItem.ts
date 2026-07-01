import type { ServerInventory } from "@/lib/shared/inventoryTypes";

export function equipWeapon(inventory: ServerInventory, uid: string) {
    const index = inventory.miscWeapons.findIndex(item => item?.uid === uid);
    if (index === -1) return false;

    const newWeapon = inventory.miscWeapons[index]!;
    const oldWeapon = inventory.weapon;

    inventory.weapon = newWeapon;
    inventory.miscWeapons[index] = oldWeapon;

    return true;
}

export function equipArmor(inventory: ServerInventory, uid: string) {
    const index = inventory.miscArmor.findIndex(item => item?.uid === uid);
    if (index === -1) return false;

    const newArmor = inventory.miscArmor[index]!;
    const oldArmor = inventory[newArmor.kind];

    inventory[newArmor.kind] = newArmor;
    inventory.miscArmor[index] = oldArmor;

    return true;
}

export function equipItem(inventory: ServerInventory, uid: string) {
    return equipWeapon(inventory, uid) || equipArmor(inventory, uid);
}
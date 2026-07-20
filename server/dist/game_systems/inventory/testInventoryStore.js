// server/inventory/playerInventoryStore.ts
import { createStartingInventory } from "./createStartingInventory.js";
const inventories = new Map();
export function getInventoryForSession(userId, player) {
    let inventory = inventories.get(userId);
    if (!inventory) {
        inventory = createStartingInventory();
        inventories.set(userId, inventory);
    }
    applyInventoryStatsToPlayer(player, inventory);
    return inventory;
}
export function deleteInventoryForSession(sessionId) {
    inventories.delete(sessionId);
}
/*
function createStartingInventory(): ServerInventory {
    return {
        gold: 100000,
        weapon: null,
        helmet: null,
        arms: null,
        chest: null,
        legs: null,

        miscWeapons: [
            { uid: randomUUID(), itemId: "great_sword0", kind: "Great Sword", level: 0 },
            { uid: randomUUID(), itemId: "great_sword1", kind: "Great Sword", level: 0 },

            { uid: randomUUID(), itemId: "great_sword1", kind: "Great Sword", level: 0 },
            { uid: randomUUID(), itemId: "great_sword0", kind: "Great Sword", level: 0 },
            { uid: randomUUID(), itemId: "great_sword2", kind: "Great Sword", level: 0 },
            { uid: randomUUID(), itemId: "great_sword3", kind: "Great Sword", level: 0 },
            ...Array(10).fill(null),
        ],

        miscArmor: [
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_arms", kind: "arms", level: 0 },
            { uid: randomUUID(), itemId: "iron_chest", kind: "chest", level: 0 },
            { uid: randomUUID(), itemId: "iron_legs", kind: "legs", level: 0 },

            { uid: randomUUID(), itemId: "iron_legs", kind: "legs", level: 0 },
            { uid: randomUUID(), itemId: "iron_legs", kind: "legs", level: 0 },
            { uid: randomUUID(), itemId: "iron_legs", kind: "legs", level: 0 },
            { uid: randomUUID(), itemId: "iron_chest", kind: "chest", level: 0 },
            { uid: randomUUID(), itemId: "iron_chest", kind: "chest", level: 0 },
            { uid: randomUUID(), itemId: "iron_chest", kind: "chest", level: 0 },
            { uid: randomUUID(), itemId: "iron_chest", kind: "chest", level: 0 },
            { uid: randomUUID(), itemId: "iron_arms", kind: "arms", level: 0 },
            { uid: randomUUID(), itemId: "iron_arms", kind: "arms", level: 0 },
            { uid: randomUUID(), itemId: "iron_arms", kind: "arms", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },
            { uid: randomUUID(), itemId: "iron_helmet", kind: "helmet", level: 0 },

            ...Array(8).fill(null),
        ],

        miscMaterial: [
            { uid: randomUUID(), itemId: "infernal_fragment", quantity: 5 },
            ...Array(11).fill(null),
        ],
    };
}
    */
// server/inventory/equipItemInInventory.ts
export function equipItemInInventory(inventory, uid) {
    return equipWeapon(inventory, uid) || equipArmor(inventory, uid);
}
export function equipWeapon(inventory, uid) {
    const index = inventory.miscWeapons.findIndex(item => item?.uid === uid);
    if (index === -1)
        return false;
    const newWeapon = inventory.miscWeapons[index];
    const oldWeapon = inventory.weapon;
    inventory.weapon = newWeapon;
    inventory.miscWeapons[index] = oldWeapon;
    return true;
}
export function equipArmor(inventory, uid) {
    const index = inventory.miscArmor.findIndex(item => item?.uid === uid);
    if (index === -1)
        return false;
    const newArmor = inventory.miscArmor[index];
    const armorSlot = newArmor.kind;
    if (armorSlot !== "helmet" &&
        armorSlot !== "arms" &&
        armorSlot !== "chest" &&
        armorSlot !== "legs") {
        return false;
    }
    const oldArmor = inventory[armorSlot];
    inventory[armorSlot] = newArmor;
    inventory.miscArmor[index] = oldArmor;
    return true;
}
export function unequipItemInInventory(inventory, slot) {
    if (slot === "weapon") {
        return unequipWeapon(inventory);
    }
    return unequipArmor(inventory, slot);
}
export function unequipWeapon(inventory) {
    if (!inventory.weapon)
        return false;
    const emptyIndex = inventory.miscWeapons.findIndex(item => item === null);
    if (emptyIndex === -1)
        return false;
    inventory.miscWeapons[emptyIndex] = inventory.weapon;
    inventory.weapon = null;
    return true;
}
export function unequipArmor(inventory, slot) {
    const equippedArmor = inventory[slot];
    if (!equippedArmor)
        return false;
    const emptyIndex = inventory.miscArmor.findIndex(item => item === null);
    if (emptyIndex === -1)
        return false;
    inventory.miscArmor[emptyIndex] = equippedArmor;
    inventory[slot] = null;
    return true;
}
export function getInventoryStats(inventory) {
    const equippedItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
    ].filter((item) => item !== null);
    const stats = {
        hp: 0,
        armor: 0,
        damage: 0,
        crit: 0,
        power: 0,
    };
    for (const item of equippedItems) {
        stats.power += item.power;
        if (item.type === "Weapon") {
            stats.damage += item.upgradedStats.damage.value;
            stats.crit += item.upgradedStats.crit.value;
        }
        else {
            stats.hp += item.upgradedStats.hp.value;
            stats.armor += item.upgradedStats.armor.value;
        }
    }
    stats.power = Math.round(stats.power / 5);
    return stats;
}
// inventoryStats.ts
export function applyInventoryStatsToPlayer(player, inventory) {
    const stats = getInventoryStats(inventory);
    player.maxHp = 100 + stats.hp;
    player.damage = stats.damage;
    player.armor = stats.armor;
    player.crit = stats.crit;
    player.power = stats.power;
    if (player.hp > player.maxHp) {
        player.hp = player.maxHp;
    }
}
//# sourceMappingURL=testInventoryStore.js.map
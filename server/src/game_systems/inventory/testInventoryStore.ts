// server/inventory/playerInventoryStore.ts

import { randomUUID } from "crypto";
import type { ServerInventory } from "./inventoryTypes.js";
import { itemDefinitions } from "../items/itemDefinitions.js";
import { PlayerState } from "../../schemas/GameState.js";
import { createStartingInventory } from "./createStartingInventory.js"

const inventories = new Map<string, ServerInventory>();

export function getInventoryForSession(sessionId: string, player: PlayerState): ServerInventory {
    let inventory = inventories.get(sessionId);

    if (!inventory) {
        inventory = createStartingInventory();
        inventories.set(sessionId, inventory);
    }

    applyInventoryStatsToPlayer(player, inventory);

    return inventory;
}

export function deleteInventoryForSession(sessionId: string) {
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

export function equipItemInInventory(inventory: ServerInventory, uid: string) {
    return equipWeapon(inventory, uid) || equipArmor(inventory, uid);
}

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
    const armorSlot = newArmor.kind;

    if (
        armorSlot !== "helmet" &&
        armorSlot !== "arms" &&
        armorSlot !== "chest" &&
        armorSlot !== "legs"
    ) {
        return false;
    }

    const oldArmor = inventory[armorSlot];

    inventory[armorSlot] = newArmor;
    inventory.miscArmor[index] = oldArmor;

    return true;
}

type EquipSlot = "weapon" | "helmet" | "arms" | "chest" | "legs";

export function unequipItemInInventory(inventory: ServerInventory, slot: EquipSlot) {
    if (slot === "weapon") {
        return unequipWeapon(inventory);
    }

    return unequipArmor(inventory, slot);
}

export function unequipWeapon(inventory: ServerInventory) {
    if (!inventory.weapon) return false;

    const emptyIndex = inventory.miscWeapons.findIndex(item => item === null);
    if (emptyIndex === -1) return false;

    inventory.miscWeapons[emptyIndex] = inventory.weapon;
    inventory.weapon = null;

    return true;
}

export function unequipArmor(
    inventory: ServerInventory,
    slot: "helmet" | "arms" | "chest" | "legs"
) {
    const equippedArmor = inventory[slot];
    if (!equippedArmor) return false;

    const emptyIndex = inventory.miscArmor.findIndex(item => item === null);
    if (emptyIndex === -1) return false;

    inventory.miscArmor[emptyIndex] = equippedArmor;
    inventory[slot] = null;

    return true;
}

export function getInventoryStats(inventory: ServerInventory) {

    const equippedItems = [
        inventory.weapon,
        inventory.helmet,
        inventory.arms,
        inventory.chest,
        inventory.legs,
    ].filter(Boolean);

    const stats = {
        hp: 5245,
        armor: 2407,
        damage: 1068,
        crit: 834,
        power: 1675,
    };

    for (const item of equippedItems) {
        const def = itemDefinitions[item!.itemId];
        if (!def) continue;

        const level = item!.level ?? 0;

        if (def.type === "Weapon") {
            stats.damage += def.baseStats.damage + level * 2;
            stats.power += def.baseStats.power + level * 2;
            stats.crit += def.baseStats.crit ?? 0;
        }

        if (def.type === "Armor") {
            stats.hp += def.baseStats.hp + level * 5;
            stats.armor += def.baseStats.armor + level * 2;
            stats.power += def.baseStats.power + level * 2;
        }

    }

    stats.power = Math.round(stats.power / 5);

    return stats;
}

// inventoryStats.ts

export function applyInventoryStatsToPlayer(
    player: PlayerState,
    inventory: ServerInventory
) {
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
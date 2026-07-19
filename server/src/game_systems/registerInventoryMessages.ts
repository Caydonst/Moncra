import { hydrateInventory } from "./inventory/hydrateInventory.js";
import { hydrateItem } from "./inventory/hydrateItem.js";
import { applyInventoryStatsToPlayer, equipItemInInventory, getInventoryForSession, unequipItemInInventory } from "./inventory/testInventoryStore.js";
import { upgradeItem } from "./items/itemUpgrading.js";

export function registerInventoryMessages(room: Room<GameState>) {
    room.onMessage("equip_item", (client, message: { uid: string }) => {
        const player = room.state.players.get(client.sessionId);
        if (!player) return;

        const inventory = getInventoryForSession(client.sessionId, player);

        const equipped = equipItemInInventory(inventory, message.uid);

        if (!equipped) {
            client.send("inventory_error", {
                error: "Item not found",
            });
            return;
        }

        applyInventoryStatsToPlayer(player, inventory);

        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });
    room.onMessage("get_inventory", (client) => {
        const player = room.state.players.get(client.sessionId);
        if (!player) return;

        const inventory = getInventoryForSession(client.sessionId, player);

        applyInventoryStatsToPlayer(player, inventory);

        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });

    room.onMessage("unequip_item", (client, message: { slot: "weapon" | "helmet" | "arms" | "chest" | "legs" }) => {
        const player = room.state.players.get(client.sessionId);
        if (!player) return;

        const inventory = getInventoryForSession(client.sessionId, player);

        const unequipped = unequipItemInInventory(inventory, message.slot);

        if (!unequipped) {
            client.send("inventory_error", {
                error: "Could not unequip item",
            });
            return;
        }

        applyInventoryStatsToPlayer(player, inventory);

        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });

    room.onMessage("upgrade_item", (client, message: { uid: string, statPoints: { damage: number, crit: number, hp: number, armor: number } }) => {
        const player = room.state.players.get(client.sessionId);
        const inventory = getInventoryForSession(client.sessionId, player);

        const result = upgradeItem(inventory, message.uid, message.statPoints);

        if (!result) {
            console.log("Item found but not upgraded", result);
            return;
        }

        /*if (!result.ok) {
            client.send("inventory_error", {
                error: result.error,
            });
            return;
        }*/

        console.log("UPGRADE RESULT BEFORE HYDRATION", {
            uid: message.uid,
            ok: result.ok,
            resultItem: result.ok
                ? {
                    uid: result.item?.uid,
                    itemId: result.item?.itemId,
                    type: result.item?.type,
                }
                : undefined,
        });

        client.send("item_upgraded", {
            upgradedItem: hydrateItem(result.item),
            inventory: hydrateInventory(inventory),
        });

        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });
}
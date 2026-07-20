import { hydrateInventory } from "./inventory/hydrateInventory.js";
import { hydrateItem } from "./inventory/hydrateItem.js";
import { applyInventoryStatsToPlayer, equipItemInInventory, getInventoryForSession, unequipItemInInventory, } from "./inventory/testInventoryStore.js";
import { upgradeItem } from "./items/itemUpgrading.js";
export function registerInventoryMessages(room) {
    room.onMessage("equip_item", (client, message) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        const userId = room.getUserId(client);
        const inventory = getInventoryForSession(userId, player);
        const equipped = equipItemInInventory(inventory, message.uid);
        if (!equipped) {
            client.send("inventory_error", {
                error: "Item not found",
            });
            return;
        }
        if (inventory.weapon) {
            player.weapon.id = inventory.weapon.itemId;
            player.weapon.damage =
                inventory.weapon.upgradedStats.damage.value;
        }
        else {
            player.weapon.id = "";
            player.weapon.damage = 0;
            player.weapon.icon = "";
        }
        applyInventoryStatsToPlayer(player, inventory);
        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });
    room.onMessage("get_inventory", (client) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        const userId = room.getUserId(client);
        const inventory = getInventoryForSession(userId, player);
        applyInventoryStatsToPlayer(player, inventory);
        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });
    room.onMessage("unequip_item", (client, message) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        const userId = room.getUserId(client);
        const inventory = getInventoryForSession(userId, player);
        const unequipped = unequipItemInInventory(inventory, message.slot);
        if (!unequipped) {
            client.send("inventory_error", {
                error: "Could not unequip item",
            });
            return;
        }
        if (!inventory.weapon) {
            player.weapon.id = "";
            player.weapon.damage = 0;
            player.weapon.icon = "";
        }
        applyInventoryStatsToPlayer(player, inventory);
        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });
    room.onMessage("upgrade_item", (client, message) => {
        const player = room.state.players.get(client.sessionId);
        if (!player)
            return;
        const userId = room.getUserId(client);
        const inventory = getInventoryForSession(userId, player);
        const result = upgradeItem(inventory, message.uid, message.statPoints);
        if (result.ok === false) {
            client.send("inventory_error", {
                error: result.error,
            });
            return;
        }
        applyInventoryStatsToPlayer(player, inventory);
        client.send("item_upgraded", {
            upgradedItem: hydrateItem(result.item),
            inventory: hydrateInventory(inventory),
        });
        client.send("inventory_updated", {
            inventory: hydrateInventory(inventory),
        });
    });
}
//# sourceMappingURL=registerInventoryMessages.js.map
import type { Inventory } from "./inventory";
import type {Item} from "../items/ItemTypes.ts";
import {getGame} from "../gameInstance"

type Colors = {
    common: string;
    rare: string;
    epic: string;
    legendary: string;
    artifact: string;
}

const rarityColors: Colors = {
    common: "#4CFF00",
    rare: "#0094FF",
    epic: "#B200FF",
    legendary: "#FFAA00",
    artifact: "#00FFF6",
}

const inventoryRarityColors = {
    common: {
        border: "#4CFF00",
        background: "#217000",
    },
    rare: {
        border: "#0094FF",
        background: "#004A7F"
    },
    epic: {
        border: "#B200FF",
        background: "#4E0072"
    },
    legendary: {
        border: "#FFAA00",
        background: "#825600"
    },
    artifact: {
        border: "#00FFF6",
        background: "#007A74"
    }
}


// ---- ITEM INFO PANEL UI ----
export function showItemInfo(inventory: Inventory, item: Item) {
    const panel = document.getElementById("item-info-panel")!;
    const iconContainer = document.getElementById("item-icon-container");
    const name = document.getElementById("item-info-name")!;
    const type = document.getElementById("item-info-type")!;
    const desc = document.getElementById("item-info-description")!;
    const icon = document.getElementById("item-info-icon")!;
    const stats = document.getElementById("item-info-stats")!;
    const equipBtn = document.getElementById("equip-btn")!;
    equipBtn.onclick = () => {
        panel.classList.add("hidden");
    };

    panel.classList.remove("hidden");
    iconContainer.style.borderColor = inventoryRarityColors[item.rarity].border;
    iconContainer.style.background = inventoryRarityColors[item.rarity].background;
    name.innerText = item.name;
    type.innerText = /*item.type.toUpperCase() + " | " +*/ item.rarity.toUpperCase();
    type.style.color = rarityColors[item.rarity];
    //desc.innerText = item.description;
    icon.src = item.icon;
    equipBtn.onclick = () => equipAndClose(item);

    const equipAndClose = (item: Item) => {
        const game = getGame();
        inventory.equipWeapon(item, game.currentScene);
        panel.classList.add("hidden");
    }

    stats.innerHTML = "";

    if (item.stats) {
        for (let key in item.stats) {
            const row = document.createElement("p");
            row.innerText = `${key}: ${item.stats[key]}`;
            stats.appendChild(row);
        }
    }
}

export function setupInventoryUI() {
    const closeBtn = document.getElementById("item-info-close");
    const equipBtn = document.getElementById("equip-btn");
    const panel = document.getElementById("item-info-panel");

    closeBtn?.addEventListener("click", () => {
        panel?.classList.add("hidden");
    });

    equipBtn?.addEventListener("click", () => {
        panel?.classList.add("hidden");
    });
}

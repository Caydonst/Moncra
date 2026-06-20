import { Armor } from "../../armor/armor";
import { Weapon } from "../../items/ItemTypes";
import { gameState } from "../../gameState/gameState"

export function upgrade(item: Weapon | Armor, goldCost: number) {

    if (item.level >= item.maxLevel) return;

    updateItemStats(item);

    gameState.inventory.removeGold(goldCost);

    console.log(item);

    return {
        ...item,
        level: item.level,
        stats: {
            ...item.stats,
            damage: item.stats.damage,
        },
    };
}

function updateItemStats(item: Weapon | Armor) {
    item.level += 1;
    item.stats.damage += 2;
}
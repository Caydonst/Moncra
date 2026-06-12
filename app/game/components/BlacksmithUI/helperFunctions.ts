import { Armor } from "../../armor/armor";
import { Weapon } from "../../items/ItemTypes";

export function upgrade(item: Weapon | Armor) {

    if (item.level >= item.maxLevel) return;

    updateItemStats(item);

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
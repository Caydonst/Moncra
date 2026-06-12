import { Armor } from "../armor/armor";
import { epicTestMaterial, legendaryTestMaterial } from "./GameItems";
import { Weapon } from "./ItemTypes";
import { Material } from "./ItemTypes";

type UpgradeMaterial = {
    material: Material,
    quantity: number,
}

type UpgradeCost = {
    gold: number;
    materials: UpgradeMaterial[],
}

const rarityMultiplier = {
    common: 1,
    uncommon: 1,
    rare: 2,
    epic: 4,
    legendary: 8,
    exalted: 16,
};

const rarityMaterial = {
    common: [epicTestMaterial],
    uncommon: [epicTestMaterial],
    rare: [epicTestMaterial],
    epic: [epicTestMaterial],
    legendary: [legendaryTestMaterial],
    exalted: [legendaryTestMaterial],
}

export function getUpgradeCost(weapon: Weapon | Armor): UpgradeCost {

    const materials: UpgradeMaterial[] = [];

    rarityMaterial[weapon.rarity].forEach(material => {
        materials.push({
            material: material,
            quantity: Math.ceil((weapon.level + 1) / 2),
        })
    })

    return {
        gold:
            100 *
            (weapon.level + 1) *
            rarityMultiplier[weapon.rarity],

        materials: materials
    };
}


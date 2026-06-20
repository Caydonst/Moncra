import { Armor } from "../armor/armor";
import { Weapon } from "./ItemTypes";
import { Material } from "./ItemTypes";
import { gameItems } from "../items/GameItems"

type UpgradeMaterial = {
    material: Material,
    quantity: number,
}

export type UpgradeCost = {
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



export function getUpgradeCost(weapon: Weapon | Armor): UpgradeCost {

    const materials: UpgradeMaterial[] = [];

    const rarityMaterial = {
        common: [gameItems.materials.legendaryTestMaterial],
        uncommon: [gameItems.materials.legendaryTestMaterial],
        rare: [gameItems.materials.legendaryTestMaterial],
        epic: [gameItems.materials.legendaryTestMaterial],
        legendary: [gameItems.materials.legendaryTestMaterial],
        exalted: [gameItems.materials.legendaryTestMaterial],
    }

    rarityMaterial[weapon.rarity].forEach(material => {
        console.log(material)
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


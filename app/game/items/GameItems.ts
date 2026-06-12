import type {Ammunition, Item, Weapon} from "@/app/ game/items/ItemTypes";
import greatSword0 from "../assets/weapons/great_sword/stone_sword.png";
import greatSword from "../assets/weapons/great_sword/vampire_sword.png";
import greatSword1 from "../assets/weapons/great_sword/ruby_sword.png";
import greatSword2 from "../assets/weapons/great_sword/diamond_sword.png";
import greatSword3 from "../assets/weapons/great_sword/iron_sword.png";
import greatSword4 from "../assets/weapons/great_sword/gold_sword.png";
import greatSword5 from "../assets/weapons/great_sword/emerald_sword.png";
import greatSword6 from "../assets/weapons/great_sword/cataclysm2.png";
import greatSword7 from "../assets/weapons/great_sword/oblivion2.png";
import greatSword8 from "../assets/weapons/great_sword/ascension.png";
import greatSword9 from "../assets/weapons/great_sword/verdict.png";
import greatSword10 from "../assets/weapons/great_sword/tidal.png";
import greatSword11 from "../assets/weapons/great_sword/starfall.png";
import obsidianArmorImg from "../assets/armor/obsidian_armor.png"
import test_material from "../assets/currency/test_material.png"
import { CriticalHit, ChainLightning } from "@/app/game/enchantments/enchantments";
import {gameState} from "../gameState/gameState"
import { Armor } from "../armor/armor";
import type { Material } from "../items/ItemTypes";

export async function createGameItems() {
    const { GreatSword } = await import("../weapons/sword");

    const GreatSword0: Weapon = {
        id: "great_sword0",
        name: "Stone Sword",
        type: "Great Sword",
        icon: greatSword0.src,
        rarity: "common",
        attackStyle: "Melee",
        stats: {
            power: 10,
            damage: 10,
        },
        level: 0,
        maxLevel: 10,
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword1.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword0,
            true,
            GreatSword0,
        ),
    };

    gameState.inventory.addItem(GreatSword0);


    const GreatSword1: Weapon = {
        id: "great_sword1",
        name: "Sword",
        type: "Great Sword",
        icon: greatSword.src,
        rarity: "legendary",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword1.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword,
            true,
            GreatSword1,
        ),
    };

    gameState.inventory.addItem(GreatSword1);

    const GreatSword2: Weapon = {
        id: "great_sword2",
        name: "Sword",
        type: "Great Sword",
        icon: greatSword2.src,
        rarity: "rare",
        attackStyle: "Melee",
        stats: {
            power: 30,
            damage: 20,
        },
        level: 0,
        maxLevel: 10,
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword2,
            false,
            GreatSword2,
        ),
    };

    gameState.inventory.addItem(GreatSword2);

    const GreatSword3: Weapon = {
        id: "obsidian_sword",
        name: "Excalibur",
        type: "Great Sword",
        icon: greatSword1.src,
        rarity: "legendary",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword1,
            false,
            GreatSword3,
        ),
    };

    gameState.inventory.addItem(GreatSword3);

    const GreatSword4: Weapon = {
        id: "great_sword4",
        name: "Sword",
        type: "Great Sword",
        icon: greatSword3.src,
        rarity: "uncommon",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword3,
            false,
            GreatSword4,
        ),
    };

    gameState.inventory.addItem(GreatSword4);

    const GreatSword5: Weapon = {
        id: "great_sword5",
        name: "Sword",
        type: "Great Sword",
        icon: greatSword4.src,
        rarity: "epic",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword4,
            false,
            GreatSword5,
        ),
    };

    gameState.inventory.addItem(GreatSword5);

    const GreatSword6: Weapon = {
        id: "great_sword6",
        name: "Sword",
        type: "Great Sword",
        icon: greatSword5.src,
        rarity: "epic",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword5,
            false,
            GreatSword6,
        ),
    };

    gameState.inventory.addItem(GreatSword6);

    const GreatSword7: Weapon = {
        id: "great_sword7",
        name: "Cataclysm",
        type: "Great Sword",
        icon: greatSword6.src,
        rarity: "exalted",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword6,
            false,
            GreatSword7,
        ),
    };

    gameState.inventory.addItem(GreatSword7);

    const GreatSword8: Weapon = {
        id: "great_sword8",
        name: "Oblivion",
        type: "Great Sword",
        icon: greatSword7.src,
        rarity: "exalted",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword7,
            false,
            GreatSword7,
        ),
    };

    gameState.inventory.addItem(GreatSword8);

    const GreatSword9: Weapon = {
        id: "great_sword9",
        name: "Ascension",
        type: "Great Sword",
        icon: greatSword8.src,
        rarity: "exalted",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword8,
            false,
            GreatSword7,
        ),
    };

    gameState.inventory.addItem(GreatSword9);

    const GreatSword10: Weapon = {
        id: "great_sword10",
        name: "Verdict",
        type: "Great Sword",
        icon: greatSword9.src,
        rarity: "exalted",
        attackStyle: "Melee",
        level: 0,
        maxLevel: 10,
        stats: {
            power: 130,
            damage: 40,
        },
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword9,
            false,
            GreatSword7,
        ),
    };

    gameState.inventory.addItem(GreatSword10);

    const GreatSword11: Weapon = {
        id: "great_sword11",
        name: "Tidal",
        type: "Great Sword",
        icon: greatSword10.src,
        rarity: "exalted",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword10,
            false,
            GreatSword7,
        ),
    };

    gameState.inventory.addItem(GreatSword11);

    const GreatSword12: Weapon = {
        id: "great_sword12",
        name: "Starfall",
        type: "Great Sword",
        icon: greatSword11.src,
        rarity: "exalted",
        attackStyle: "Melee",
        stats: {
            power: 130,
            damage: 40,
        },
        level: 0,
        maxLevel: 10,
        enchantments: [CriticalHit, ChainLightning],
        createWeapon: () => new GreatSword(
            gameState.engine.currentScene.player,
            gameState.engine,
            gameState.engine.currentScene.resources,
            gameState.engine.currentScene.collisionGroups,
            GreatSword2.stats.damage,
            gameState.engine.currentScene.resources.Images.greatSword11,
            false,
            GreatSword7,
        ),
    };

    gameState.inventory.addItem(GreatSword12);

    const ObsidianArmor = new Armor({
        id: "obsidian_armor",
        name: "Obsidian Armor",
        description: "A sturdy iron chestplate.",
        icon: obsidianArmorImg.src,
        type: "Armor",
        rarity: "exalted",
        stats: {
            hp: 50,
            defense: 15,
            power: 130,
        },
        level: 0,
        maxLevel: 10,
    })

    gameState.inventory.addItem(ObsidianArmor);
}

export const legendaryTestMaterial: Material = {
    id: "infernal_fagment",
    name: "Infernal Fragment",
    rarity: "legendary",
    icon: test_material.src,
}
export const epicTestMaterial: Material = {
    id: "infernal_fagment",
    name: "Infernal Fragment",
    rarity: "epic",
    icon: test_material.src,
}
// armor.ts

import * as ex from "excalibur";
import { Enchantment } from "../enchantments/enchantments";
import type {Rarity} from "../items/ItemTypes"

type Stats = {
    hp: number,
    defense: number,
    power: number,
}

export class Armor {
    public uid: string;
    public id: string;
    public name: string;
    public description: string;
    public icon: string;
    public type: "Armor";
    public rarity: Rarity;
    public stats: Stats;
    public level: number;
    public maxLevel: number;
    public enchantments?: Enchantment[]

    constructor({
        uid,
        id,
        name,
        description,
        icon,
        type,
        rarity,
        stats,
        level,
        maxLevel,
        enchantments,
    }: {
        uid: string,
        id: string;
        name: string;
        description: string;
        icon: string;
        type: "Armor";
        rarity: Rarity;
        stats: Stats;
        level: number;
        maxLevel: number;
        enchantments: Enchantment[];
    }) {
        this.uid = uid;
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.type = type;
        this.rarity = rarity;
        this.stats = stats;
        this.level = level;
        this.maxLevel = maxLevel;
        this.enchantments = enchantments;
    }
}
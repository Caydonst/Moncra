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
    public id: string;
    public name: string;
    public description: string;
    public icon: string;
    public type: string;
    public rarity: Rarity;
    public stats: Stats;
    public level: number;
    public maxLevel: number;
    public enchantments?: Enchantment[]

    constructor({
        id,
        name,
        description,
        icon,
        type,
        rarity,
        stats,
        level,
        maxLevel,
    }: {
        id: string;
        name: string;
        description: string;
        icon: string;
        type: string;
        rarity: Rarity;
        stats: Stats;
        level: number;
        maxLevel: number;
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.type = type;
        this.rarity = rarity;
        this.stats = stats;
        this.level = level;
        this.maxLevel = maxLevel;
    }
}
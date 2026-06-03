// armor.ts

import * as ex from "excalibur";

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
    public rarity: string;
    public stats: Stats;

    constructor({
        id,
        name,
        description,
        icon,
        type,
        rarity,
        stats,
    }: {
        id: string;
        name: string;
        description: string;
        icon: string;
        type: string;
        rarity: string;
        stats: Stats;
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.type = type;
        this.rarity = rarity;
        this.stats = stats;
    }
}
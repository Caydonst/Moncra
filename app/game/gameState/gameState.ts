import { Inventory } from "../inventory/inventory";
import type { Player } from "../player/player";

export class GameState {
    inventory: Inventory;
    player?: Player;
    engine?: any;
    resources?: any;
    playerStats?: any;
    username?: string;

    constructor() {
        this.inventory = new Inventory();
        this.username = "";
    }
}

export const gameState = new GameState();
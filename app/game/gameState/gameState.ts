import { Inventory } from "../inventory/inventory";
import type { Player } from "../player/player";

export class GameState {
    inventory: Inventory;
    player?: Player;
    engine?: any;
    resources?: any;
    playerStats?: any;

    constructor() {
        this.inventory = new Inventory();
    }
}

export const gameState = new GameState();
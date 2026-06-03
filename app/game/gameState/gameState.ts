import { Inventory } from "../inventory/inventory";
import { Player } from "../player/player";

export class GameState {
  inventory: Inventory;
  player?: Player;

  constructor() {
    this.inventory = new Inventory();
  }
}

export const gameState = new GameState();
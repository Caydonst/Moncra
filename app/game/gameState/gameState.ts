import { Inventory } from "../inventory/inventory";
import { Player } from "../player";

export class GameState {
  inventory: Inventory;
  playerHp = 100;
  playerMaxHp = 100;
  player?: Player;

  constructor() {
    this.inventory = new Inventory();
  }
}

export const gameState = new GameState();
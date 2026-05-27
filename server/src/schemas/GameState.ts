import { Schema, MapSchema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") rotation: number = 0;
  @type("number") hp: number = 100;
  @type("string") weaponId: string = "";
  @type("number") aimAngle: number = 0;
  @type("boolean") isAttacking: boolean = false;
  @type("number") attackId: number = 0;
}

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
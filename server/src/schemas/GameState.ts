import { Schema, MapSchema, type } from "@colyseus/schema";

class Weapon extends Schema {
  @type("string") id: string = "";
  @type("string") icon: string = "";
  @type("number") damage: number = 0;
}

export class PlayerState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") rotation: number = 0;
  @type("number") hp: number = 100;

  @type(Weapon) weapon: Weapon = new Weapon();
  @type("number") aimAngle: number = 0;
  @type("boolean") isAttacking: boolean = false;
  @type("number") attackId: number = 0;

  // Sentinel
  @type("number") resolve: number = 100;
  @type("number") maxResolve: number = 100;
  @type("boolean") guardStance: boolean = false;
  @type("boolean") isBlocking: boolean = false;
  @type("boolean") isCharging: boolean = false;
  @type("number") chargeResolveUsed: number = 0;
  @type("number") lastResolveGainTime: number = 0;
}

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
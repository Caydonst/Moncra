import { Schema, MapSchema, type } from "@colyseus/schema";

class Weapon extends Schema {
  @type("string") id: string = "";
  @type("string") icon: string = "";
  @type("number") damage: number = 0;
}

export class GreatSwordState extends Schema {
  @type("number") comboIndex: number = 0;
  @type("number") lastAttackTime: number = 0;
  @type("number") lastComboTime: number = 0;
  @type("number") attackId: number = 0;
}

export class PlayerState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") moveX = 0;
  @type("number") moveY = 0;
  @type("number") rotation: number = 0;
  @type("number") damage: number = 0;
  @type("number") crit: number = 0;
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") armor: number = 0;
  @type("number") power: number = 0;
  @type("number") lastMoveTime: number = Date.now();

  @type("number") currentXp: number = 0;
  @type("number") xpToNextLvl: number = 100;

  @type("boolean") isDashing = false;
  @type("number") dashStartedAt = 0;
  @type("number") lastDashTime = 0;
  @type("number") dashDirX = 0;
  @type("number") dashDirY = 0;
  @type("number") dashDistanceRemaining = 0;

  @type(Weapon) weapon: Weapon = new Weapon();

  @type(GreatSwordState) greatSword: GreatSwordState = new GreatSwordState();

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

export class EnemyState extends Schema {
  @type("string") id = "";
  @type("string") type = "demon";

  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") vx = 0;
  @type("number") vy = 0;

  @type("number") hp = 100;
  @type("number") maxHp = 100;
  @type("number") damage = 15;
  @type("number") speed = 220;
  @type("number") radius = 18;

  @type("boolean") isDead = false;
  @type("boolean") isAggro = false;
  @type("string") state = "idle";

  @type("string") targetSessionId = "";

  @type("number") lastDamageTime = 0;
  @type("number") damageCooldown = 500;

  @type("number") knockbackX = 0;
  @type("number") knockbackY = 0;
  @type("number") knockbackUntil = 0;
}

export class GameState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>();
}
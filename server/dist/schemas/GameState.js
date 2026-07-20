var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Schema, MapSchema, type } from "@colyseus/schema";
class Weapon extends Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.icon = "";
        this.damage = 0;
    }
}
__decorate([
    type("string")
], Weapon.prototype, "id", void 0);
__decorate([
    type("string")
], Weapon.prototype, "icon", void 0);
__decorate([
    type("number")
], Weapon.prototype, "damage", void 0);
export class GreatSwordState extends Schema {
    constructor() {
        super(...arguments);
        this.comboIndex = 0;
        this.lastAttackTime = 0;
        this.lastComboTime = 0;
        this.attackId = 0;
        this.hitTargets = new Set();
    }
}
__decorate([
    type("number")
], GreatSwordState.prototype, "comboIndex", void 0);
__decorate([
    type("number")
], GreatSwordState.prototype, "lastAttackTime", void 0);
__decorate([
    type("number")
], GreatSwordState.prototype, "lastComboTime", void 0);
__decorate([
    type("number")
], GreatSwordState.prototype, "attackId", void 0);
export class PlayerState extends Schema {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        this.moveX = 0;
        this.moveY = 0;
        this.rotation = 0;
        this.damage = 0;
        this.crit = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.armor = 0;
        this.power = 0;
        this.lastMoveTime = Date.now();
        this.level = 0;
        this.currentXp = 0;
        this.xpToNextLvl = 100;
        this.isDashing = false;
        this.dashStartedAt = 0;
        this.lastDashTime = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.dashDistanceRemaining = 0;
        this.weapon = new Weapon();
        this.greatSword = new GreatSwordState();
        this.aimAngle = 0;
        this.isAttacking = false;
        this.attackId = 0;
        this.attackAimAngle = 0;
        this.attackType = "";
        this.attackDuration = 0;
        this.attackDamage = 0;
        // Sentinel
        this.resolve = 100;
        this.maxResolve = 100;
        this.guardStance = false;
        this.isBlocking = false;
        this.isCharging = false;
        this.chargeResolveUsed = 0;
        this.lastResolveGainTime = 0;
    }
}
__decorate([
    type("number")
], PlayerState.prototype, "x", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "y", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "moveX", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "moveY", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "rotation", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "damage", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "crit", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "hp", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "maxHp", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "armor", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "power", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "lastMoveTime", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "level", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "currentXp", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "xpToNextLvl", void 0);
__decorate([
    type("boolean")
], PlayerState.prototype, "isDashing", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "dashStartedAt", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "lastDashTime", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "dashDirX", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "dashDirY", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "dashDistanceRemaining", void 0);
__decorate([
    type(Weapon)
], PlayerState.prototype, "weapon", void 0);
__decorate([
    type(GreatSwordState)
], PlayerState.prototype, "greatSword", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "aimAngle", void 0);
__decorate([
    type("boolean")
], PlayerState.prototype, "isAttacking", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "attackId", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "attackAimAngle", void 0);
__decorate([
    type("string")
], PlayerState.prototype, "attackType", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "attackDuration", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "attackDamage", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "resolve", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "maxResolve", void 0);
__decorate([
    type("boolean")
], PlayerState.prototype, "guardStance", void 0);
__decorate([
    type("boolean")
], PlayerState.prototype, "isBlocking", void 0);
__decorate([
    type("boolean")
], PlayerState.prototype, "isCharging", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "chargeResolveUsed", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "lastResolveGainTime", void 0);
export class EnemyState extends Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.type = "demon";
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.damage = 15;
        this.speed = 220;
        this.radius = 18;
        this.isDead = false;
        this.isAggro = false;
        this.state = "idle";
        this.targetSessionId = "";
        this.lastDamageTime = 0;
        this.damageCooldown = 500;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackUntil = 0;
    }
}
__decorate([
    type("string")
], EnemyState.prototype, "id", void 0);
__decorate([
    type("string")
], EnemyState.prototype, "type", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "x", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "y", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "vx", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "vy", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "hp", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "maxHp", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "damage", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "speed", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "radius", void 0);
__decorate([
    type("boolean")
], EnemyState.prototype, "isDead", void 0);
__decorate([
    type("boolean")
], EnemyState.prototype, "isAggro", void 0);
__decorate([
    type("string")
], EnemyState.prototype, "state", void 0);
__decorate([
    type("string")
], EnemyState.prototype, "targetSessionId", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "lastDamageTime", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "damageCooldown", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "knockbackX", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "knockbackY", void 0);
__decorate([
    type("number")
], EnemyState.prototype, "knockbackUntil", void 0);
export class GameState extends Schema {
    constructor() {
        super(...arguments);
        this.players = new MapSchema();
        this.enemies = new MapSchema();
    }
}
__decorate([
    type({ map: PlayerState })
], GameState.prototype, "players", void 0);
__decorate([
    type({ map: EnemyState })
], GameState.prototype, "enemies", void 0);
//# sourceMappingURL=GameState.js.map
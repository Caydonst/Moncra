export interface DamageContext {
  attacker: any;
  target: any;
  weapon: any;
  baseDamage: number;
  finalDamage: number;
  isCrit: boolean;
  scene: any;
}

export interface Enchantment {
  id: string;
  name: string;

  onBeforeDamage?: (ctx: DamageContext) => void;
  onAfterDamage?: (ctx: DamageContext) => void;
  onKill?: (ctx: DamageContext) => void;
}

export const CriticalHit: Enchantment = {
  id: "critical_hit",
  name: "Critical Hit",

  onBeforeDamage(ctx) {
    const critChance = 0.2;
    const critMultiplier = 2;

    if (Math.random() < critChance) {
      ctx.finalDamage *= critMultiplier;
      ctx.isCrit = true;
    }
  }
};

export const ChainLightning: Enchantment = {
  id: "chain_lightning",
  name: "Chain Lightning",

  onAfterDamage(ctx) {
    if (Math.random() > 0.25) return;

    const nearbyEnemies = ctx.scene.currentEnemies.filter((enemy: any) => {
      if (enemy === ctx.target || enemy.isDead) return false;
      return enemy.pos.distance(ctx.target.pos) < 200;
    });

    nearbyEnemies.slice(0, 3).forEach((enemy: any) => {
      enemy.takeDamage(ctx.finalDamage * 0.35);
    });
  }
};
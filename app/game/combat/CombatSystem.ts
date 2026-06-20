import { DamageContext } from "../enchantments/enchantments";
import { Weapon } from "../items/ItemTypes";
import { Player } from "../player/player";
import { GameScene } from "../scenes/GameScene";

export function damageEnemy(
  attacker: Player,
  target: any,
  weapon: Weapon,
  scene: GameScene
) {
  const ctx: DamageContext = {
    attacker,
    target,
    weapon,
    baseDamage: weapon.stats.damage,
    finalDamage: weapon.stats.damage,
    isCrit: false,
    scene
  };
  if (weapon.enchantments !== undefined && weapon.enchantments.length > 0) {
    weapon.enchantments?.forEach(e => e.onBeforeDamage?.(ctx));

    

    weapon.enchantments?.forEach(e => e.onAfterDamage?.(ctx));
  }

  target.takeDamage(ctx.finalDamage);


  if (target.hp <= 0) {
    weapon.enchantments?.forEach(e => e.onKill?.(ctx));
  }
}
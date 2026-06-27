import type { Room, Client } from "@colyseus/core";
import type { GameState } from "../schemas/GameState.js";
import { handleGreatSwordAttack } from "./great_sword/GreatSword.js";

const hitEnemies = new Set<string>();

export function registerCombatMessages(room: Room<GameState>) {
    room.onMessage("equip_weapon", (client, data) => {
        const player = room.state.players.get(client.sessionId);
        if (!player) return;

        player.weapon.id = String(data.weaponId);
    });

    room.onMessage("weapon_attack", (client: Client, data) => {
        const player = room.state.players.get(client.sessionId);
        if (!player) return;

        const weaponId = String(data.weaponId);
        const aimAngle = Number(data.aimAngle);

        if (!Number.isFinite(aimAngle)) return;
        if (weaponId !== player.weapon.id) return;

        const result = handleGreatSwordAttack(
            {
                x: player.x,
                y: player.y,
                weaponId: player.weapon.id,
                greatSword: player.greatSword,
            },
            {
                weaponId,
                aimAngle,
            }
        );

        if (!result) return;

        const clientAttackId = Number(data.attackId);
        if (!Number.isFinite(clientAttackId)) return;

        player.isAttacking = true;
        player.attackId = clientAttackId;
        player.attackAimAngle = aimAngle;
        player.attackType = result.attack.type;
        player.attackDuration = result.attack.duration;
        player.attackDamage =
            (player.weapon.damage || 10) * result.attack.damageMultiplier;

        room.clock.setTimeout(() => {
            if (player.attackId === result.attackId) {
                player.isAttacking = false;
            }
        }, result.attack.duration);

        room.broadcast("weapon_attack", {
            sessionId: client.sessionId,
            weaponId,
            aimAngle,
            attackId: clientAttackId,
            comboIndex: result.comboIndex,
            attack: result.attack,
        });
    });

    room.onMessage("sword_hit", (client, data) => {
        console.log("SWORD_HIT RECEIVED", data);

        const player = room.state.players.get(client.sessionId);

        if (!player) {
            console.log("reject: no player");
            return;
        }

        if (!player.isAttacking) {
            console.log("reject: player not attacking", {
                serverAttackId: player.attackId,
            });
            return;
        }

        const enemyId = String(data.enemyId);
        const enemy = room.state.enemies.get(enemyId);

        if (!enemy) {
            console.log("reject: enemy not found", enemyId);
            return;
        }

        if (enemy.isDead) {
            console.log("reject: enemy dead");
            return;
        }

        if (Number(data.attackId) !== player.attackId) {
            console.log("reject: attackId mismatch", {
                clientAttackId: data.attackId,
                serverAttackId: player.attackId,
            });
            return;
        }

        console.log("HIT VALID, APPLYING DAMAGE");

        const beforeHp = enemy.hp;

        enemy.hp = Math.max(0, enemy.hp - player.attackDamage);

        if (enemy.hp > 0) {
            enemy.state = "hurt";
        }

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const mag = Math.hypot(dx, dy) || 1;

        const knockbackStrength = 520;
        const knockbackDuration = 120;

        enemy.knockbackX = (dx / mag) * knockbackStrength;
        enemy.knockbackY = (dy / mag) * knockbackStrength;
        enemy.knockbackUntil = room.clock.currentTime + knockbackDuration;

        enemy.vx = enemy.knockbackX;
        enemy.vy = enemy.knockbackY;

        console.log("ENEMY DAMAGED", {
            enemyId,
            beforeHp,
            damage: player.attackDamage,
            afterHp: enemy.hp,
        });

        if (enemy.hp <= 0) {
            enemy.hp = 0;
            enemy.isDead = true;
            enemy.state = "dead";
        }
    });
}

function angleDifference(a: number, b: number) {
    return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}
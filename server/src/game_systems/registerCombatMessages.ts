import type { Room, Client } from "@colyseus/core";
import type { EnemyState, GameState } from "../schemas/GameState.js";
import {
    canGreatSwordHit,
    handleGreatSwordAttack,
} from "./great_sword/GreatSword.js";
import { addEnemyContributor, getEnemyContributors } from "./combat/enemyContributors.js";

type PlayerCombatRoom =
    Room<{ state: GameState }>;

export function registerPlayerCombatMessages(
    room: PlayerCombatRoom
) {
    room.onMessage(
        "equip_weapon",
        (client, data) => {
            const player =
                room.state.players.get(
                    client.sessionId
                );

            if (!player) return;

            player.weapon.id =
                String(data.weaponId);
        }
    );

    room.onMessage(
        "weapon_attack",
        (
            client: Client,
            data: {
                attackId: number;
                weaponId: string;
                aimAngle: number;
                attackType:
                | "normal"
                | "heavy";
            }
        ) => {
            const player =
                room.state.players.get(
                    client.sessionId
                );

            if (!player) {
                return;
            }

            const weaponId =
                String(data.weaponId);

            const aimAngle =
                Number(data.aimAngle);

            const rawAttackType =
                String(data.attackType);

            if (
                rawAttackType !== "normal" &&
                rawAttackType !== "heavy"
            ) {
                client.send(
                    "combat_error",
                    {
                        error:
                            "Invalid attack type.",
                    }
                );

                return;
            }

            const attackType:
                | "normal"
                | "heavy" =
                rawAttackType;

            if (
                !Number.isFinite(
                    aimAngle
                )
            ) {
                return;
            }

            if (
                weaponId !==
                player.weapon.id
            ) {
                console.warn(
                    "Party attack weapon mismatch:",
                    {
                        received:
                            weaponId,
                        equipped:
                            player.weapon.id,
                    }
                );

                return;
            }

            const clientAttackId =
                Number(data.attackId);

            if (
                !Number.isInteger(
                    clientAttackId
                )
            ) {
                return;
            }

            /*
             * Use the same authoritative combo logic
             * as DungeonRoom.
             *
             * handleGreatSwordAttack() is responsible
             * for advancing or resetting the combo based
             * on the time between attacks.
             */
            const result =
                handleGreatSwordAttack(
                    {
                        x:
                            player.x,

                        y:
                            player.y,

                        weaponId:
                            player.weapon.id,

                        greatSword:
                            player.greatSword,
                    },
                    {
                        weaponId,
                        aimAngle,
                        attackType,
                        clientAttackId,
                    }
                );

            if (!result) {
                return;
            }

            const serverAttackId =
                result.serverAttackId;

            player.isAttacking =
                true;

            player.attackId =
                serverAttackId;

            player.attackAimAngle =
                aimAngle;

            player.attackType =
                result.inputAttackType;

            player.comboAttackType =
                result.attack.type;

            player.attackDuration =
                result.attack.duration;

            player.attackDamage =
                (
                    player.weapon.damage ||
                    10
                ) *
                result.attack
                    .damageMultiplier;

            room.clock.setTimeout(
                () => {
                    /*
                     * Do not stop a newer attack when an
                     * earlier attack's timer finishes.
                     */
                    if (
                        player.attackId ===
                        serverAttackId
                    ) {
                        player.isAttacking =
                            false;
                    }
                },
                result.attack.duration
            );

            room.broadcast(
                "weapon_attack",
                {
                    sessionId:
                        client.sessionId,

                    weaponId,

                    aimAngle,

                    clientAttackId:
                        result.clientAttackId,

                    serverAttackId:
                        result.serverAttackId,

                    attackType:
                        result.inputAttackType,

                    comboAttackType:
                        result.attack.type,

                    comboIndex:
                        result.comboIndex,

                    attack:
                        result.attack,
                }
            );
        }
    );

    room.onMessage(
        "weapon_attack_start",
        (client, data) => {
            room.broadcast(
                "weapon_attack_start",
                {
                    sessionId:
                        client.sessionId,
                    ...data,
                }
            );
        }
    );

    room.onMessage(
        "weapon_attack_release",
        (client, data) => {
            room.broadcast(
                "weapon_attack_release",
                {
                    sessionId:
                        client.sessionId,
                    ...data,
                }
            );
        }
    );
}

type DungeonCombatRoom =
    Room<{ state: GameState }> & {
        awardEnemyExperience(
            enemyId: string,
            enemy: EnemyState
        ): void;
    };

export function registerDungeonCombatMessages(room: DungeonCombatRoom) {
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
        
        const rawAttackType = String(data.attackType);

        if (
            rawAttackType !== "normal" &&
            rawAttackType !== "heavy"
        ) {
            client.send("combat_error", {
                error: "Invalid attack type.",
            });

            return;
        }

        const attackType:
            | "normal"
            | "heavy" =
            rawAttackType;

        console.log("WEAPONID: ", weaponId);
        console.log("PLAYER WEAPONID: ", player.weapon.id);        

        if (!Number.isFinite(aimAngle)) return;
        if (weaponId !== player.weapon.id) return;

        const clientAttackId = Number(data.attackId);

        if (!Number.isInteger(clientAttackId)) {
            return;
        }

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
                attackType,
                clientAttackId,
            }
        );

        if (!result) {
            return;
        }

        const serverAttackId =
            result.serverAttackId;

        player.isAttacking = true;

        /*
         * This is the authoritative server-generated ID.
         */
        player.attackId =
            serverAttackId;

        player.attackAimAngle =
            aimAngle;

        player.attackType =
            result.inputAttackType;

        player.comboAttackType =
            result.attack.type;

        player.attackDuration =
            result.attack.duration;

        player.attackDamage =
            (player.weapon.damage || 10) *
            result.attack.damageMultiplier;

        room.clock.setTimeout(() => {
            /*
             * Do not stop a newer attack when this old timer finishes.
             */
            if (
                player.attackId ===
                serverAttackId
            ) {
                player.isAttacking = false;
            }
        }, result.attack.duration);

        room.broadcast("weapon_attack", {
            sessionId: client.sessionId,
            weaponId,
            aimAngle,

            clientAttackId:
                result.clientAttackId,

            serverAttackId:
                result.serverAttackId,

            attackType:
                result.inputAttackType,

            comboAttackType:
                result.attack.type,

            comboIndex:
                result.comboIndex,

            attack:
                result.attack,
        });
    });

    room.onMessage("sword_hit", (client, data) => {
        console.log("SWORD_HIT RECEIVED", data);

        const player =
            room.state.players.get(client.sessionId);

        if (!player) {
            console.log("reject: no player");
            return;
        }

        const enemyId = String(data.enemyId);

        const enemy =
            room.state.enemies.get(enemyId);

        if (!enemy) {
            console.log(
                "reject: enemy not found",
                enemyId
            );
            return;
        }

        if (enemy.isDead) {
            console.log("reject: enemy dead");
            return;
        }

        if (
            enemy.currentFloor !==
            player.currentFloor
        ) {
            client.send("combat_error", {
                error: "Enemy is on another floor.",
            });

            return;
        }

        if (!player.isAttacking) {
            console.log(
                "reject: player not attacking",
                {
                    serverAttackId:
                        player.attackId,
                }
            );

            return;
        }

        const serverAttackId =
            Number(data.serverAttackId);

        if (!Number.isInteger(serverAttackId)) {
            console.log(
                "reject: invalid server attack ID",
                data.serverAttackId
            );

            return;
        }

        if (
            serverAttackId !==
            player.attackId
        ) {
            console.log(
                "reject: server attack ID mismatch",
                {
                    received:
                        serverAttackId,
                    expected:
                        player.attackId,
                }
            );

            return;
        }

        if (
            !canGreatSwordHit(
                player.greatSword,
                enemyId,
                serverAttackId
            )
        ) {
            console.log(
                "reject: invalid or duplicate hit",
                {
                    enemyId,
                    serverAttackId,
                }
            );

            return;
        }

        console.log(
            "HIT VALID, APPLYING DAMAGE"
        );

        addEnemyContributor(
            enemyId,
            client.sessionId
        );

        const beforeHp = enemy.hp;

        enemy.hp = Math.max(
            0,
            enemy.hp - player.attackDamage
        );

        if (enemy.hp > 0) {
            enemy.state = "hurt";
        }

        const dx =
            enemy.x - player.x;

        const dy =
            enemy.y - player.y;

        const magnitude =
            Math.hypot(dx, dy) || 1;

        const knockbackStrength =
            player.attackType === "heavy"
                ? 850
                : 520;

        const knockbackDuration =
            player.attackType === "heavy"
                ? 220
                : 120;

        enemy.knockbackX =
            (dx / magnitude) *
            knockbackStrength;

        enemy.knockbackY =
            (dy / magnitude) *
            knockbackStrength;

        enemy.knockbackUntil =
            room.clock.currentTime +
            knockbackDuration;

        enemy.vx =
            enemy.knockbackX;

        enemy.vy =
            enemy.knockbackY;

        console.log("ENEMY DAMAGED", {
            enemyId,
            serverAttackId,
            attackType:
                player.attackType,
            beforeHp,
            damage:
                player.attackDamage,
            afterHp:
                enemy.hp,
        });

        if (enemy.hp <= 0) {
            enemy.hp = 0;
            enemy.isDead = true;
            enemy.state = "dead";

            room.awardEnemyExperience(
                enemyId,
                enemy
            );

            console.log(
                "ENEMY CONTRIBUTORS: ",
                getEnemyContributors(enemyId)
            );
        }
    });
}

function angleDifference(a: number, b: number) {
    return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}
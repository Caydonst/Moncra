import type { Client } from "@colyseus/core";

import type {
    EnemyState,
    GameState,
    PlayerState,
} from "../../schemas/GameState.js";

import {
    areHitboxesOverlapping,
    type Hitbox,
} from "./collisions.js";

const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 42;

const DEMON_WIDTH = 35;
const DEMON_HEIGHT = 52.5;

const CONTACT_DAMAGE = 10;
const CONTACT_COOLDOWN_MS = 1000;

export class EnemyCombatSystem {
    private damageCooldowns =
        new Map<string, number>();

    update(
        state: GameState,
        clients: Client[],
        currentTime: number
    ): void {
        state.enemies.forEach(
            (enemy, enemyId) => {
                if (enemy.isDead) {
                    return;
                }

                state.players.forEach(
                    (player, sessionId) => {
                        if (
                            player.isDead ||
                            player.hp <= 0
                        ) {
                            return;
                        }

                        if (
                            enemy.currentFloor !==
                            player.currentFloor
                        ) {
                            return;
                        }

                        const overlapping =
                            areHitboxesOverlapping(
                                this.getEnemyHitbox(
                                    enemy
                                ),
                                this.getPlayerHitbox(
                                    player
                                )
                            );

                        if (!overlapping) {
                            return;
                        }

                        const key =
                            this.createCooldownKey(
                                enemyId,
                                sessionId
                            );

                        const lastHit =
                            this.damageCooldowns.get(
                                key
                            ) ?? -Infinity;

                        if (
                            currentTime - lastHit <
                            CONTACT_COOLDOWN_MS
                        ) {
                            return;
                        }

                        this.damagePlayer(
                            enemy,
                            enemyId,
                            player,
                            sessionId,
                            clients
                        );

                        this.damageCooldowns.set(
                            key,
                            currentTime
                        );
                    }
                );
            }
        );
    }

    removeEnemy(enemyId: string): void {
        const prefix = `${enemyId}:`;

        for (
            const key
            of this.damageCooldowns.keys()
        ) {
            if (key.startsWith(prefix)) {
                this.damageCooldowns.delete(
                    key
                );
            }
        }
    }

    removePlayer(sessionId: string): void {
        const suffix = `:${sessionId}`;

        for (
            const key
            of this.damageCooldowns.keys()
        ) {
            if (key.endsWith(suffix)) {
                this.damageCooldowns.delete(
                    key
                );
            }
        }
    }

    private damagePlayer(
        enemy: EnemyState,
        enemyId: string,
        player: PlayerState,
        sessionId: string,
        clients: Client[]
    ): void {
        const rawDamage =
            enemy.damage ?? CONTACT_DAMAGE;

        const multiplier =
            100 /
            (100 + Math.max(0, player.armor));

        const finalDamage = Math.max(
            1,
            Math.round(rawDamage * multiplier)
        );

        player.hp = Math.max(
            0,
            player.hp - finalDamage
        );

        const client = clients.find(
            client =>
                client.sessionId === sessionId
        );

        console.log("ENEMY DAMAGE: ", finalDamage);

        client?.send("player_damaged", {
            enemyId,
            damage: finalDamage,
            hp: player.hp,
            maxHp: player.maxHp,
        });

        if (
            player.hp <= 0 &&
            !player.isDead
        ) {
            player.hp = 0;
            player.isDead = true;

            client?.send("player_died");
        }
    }

    private getEnemyHitbox(
        enemy: {
            x: number;
            y: number;
        }
    ): Hitbox {
        return {
            x: enemy.x,
            y: enemy.y,
            width: DEMON_WIDTH,
            height: DEMON_HEIGHT,
        };
    }

    private getPlayerHitbox(
        player: {
            x: number;
            y: number;
        }
    ): Hitbox {
        return {
            x: player.x,
            y: player.y,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
        };
    }

    private createCooldownKey(
        enemyId: string,
        sessionId: string
    ): string {
        return `${enemyId}:${sessionId}`;
    }
}
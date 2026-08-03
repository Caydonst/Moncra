const ex = await import("excalibur");
import { GameResources } from '../resources';
import { Player } from '../player/player';
import { Shadow } from "../utils/shadow";
import { Demon } from "../enemies/demon";
import { Outline, EnchantEffect, EnchantedGlowEffect } from "../utils/swordOutline";
import { DemonBoss } from "../enemies/bosses/DemonBoss";
import { GameScene } from '../scenes/GameScene';
import { multiplayer } from '../network/multiplayer';
import { damageEnemy } from '../combat/CombatSystem';
import type { Weapon } from '../items/ItemTypes';
import { isTypingInInput } from '../utils/inputUtils';

export type AttackType = "slash" | "thrust";

export type Attack = {
    type: AttackType;
    duration: number;
    cooldown: number;
    damageMultiplier: number;
    startOffset?: number;
    endOffset?: number;
    swingFlip?: boolean;
    thrustDistance?: number;
};

type ServerAttack = {
    clientAttackId: number;
    serverAttackId: number;

    weaponId: string;
    aimAngle: number;

    attackType: "normal" | "heavy";
    comboAttackType: "slash" | "thrust";

    comboIndex: number;
    attack: Attack;
};

type PredictedAttack = {
    clientAttackId: number;
    weaponId: string;
    aimAngle: number;
    comboIndex: number;
    attack: Attack;
};

type PendingSwordHit = {
    enemyId: string;
    hitT: number;
    aimAngle: number;
    attackType: "normal" | "heavy";
};

export class GreatSword extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector; // radius from player center

    private listenersAttached = false;

    // Swing state
    protected swinging = false;
    protected swingProgress = 0;
    protected swingDuration = 250; // ms for full swing
    protected isHolding = false;

    protected swingStartAngle = 0;
    protected swingEndAngle = 0;

    protected swingTracer: SwingTracer;

    // Orbit around player
    private orbitAngle = 0;
    private idleOrbitAngleOffset = Math.PI / 1.5;

    private readonly ROT_OFFSET = Math.PI / 2; // tweak based on sprite art

    private shadow: Shadow;

    private thrustDirection = ex.vec(0, 0);
    private thrustDistance!: number; // shorter thrust
    private thrustPauseTime = 150; // ms pause at peak
    protected thrusting = false;
    protected thrustTracer!: ThrustTracer;

    // Heavy attack state (right click)
    protected heavyAttacking = false;
    private heavyAttackProgress = 0;
    private heavyAttackAimAngle = 0;
    private heavySlashSpawned = false;
    private lastHeavyAttackTime = -Infinity;

    private readonly HEAVY_ATTACK_DURATION = 650;
    private readonly HEAVY_ATTACK_RELEASE_TIME = 360;
    private readonly HEAVY_ATTACK_COOLDOWN = 1400;
    private readonly HEAVY_SLASH_DISTANCE = 420;
    private readonly HEAVY_SLASH_SPEED = 900;

    private swingStartOffset = 0;
    private swingEndOffset = 0;

    private waitingForAttack = false;

    private predictedComboIndex = 0;
    private lastPredictedAttackTime = 0;
    private comboThreshold = 600;

    private currentServerAttackId: number | null = null;

    private pendingHits = new Map<string, PendingSwordHit>();

    private readonly predictedCombo: Attack[] = [
        {
            type: "slash",
            duration: 400,
            cooldown: 350,
            damageMultiplier: 1,
            startOffset: Math.PI / 1.5,
            endOffset: -Math.PI / 1.5,
            swingFlip: false,
        },
        {
            type: "slash",
            duration: 400,
            cooldown: 350,
            damageMultiplier: 1,
            startOffset: -Math.PI / 1.5,
            endOffset: Math.PI / 1.5,
            swingFlip: true,
        },
        {
            type: "slash",
            duration: 400,
            cooldown: 350,
            damageMultiplier: 1.2,
            startOffset: -Math.PI / 1.5,
            endOffset: Math.PI / 1.5,
            swingFlip: true,
        },
        {
            type: "thrust",
            duration: 400,
            cooldown: 350,
            damageMultiplier: 1.5,
            thrustDistance: 15,
        },
    ];

    private currentAttackId = 0;
    private hitEnemiesThisAttack = new Set<string>();

    private isPointerOverUI(): boolean {
        const hoveredElement = document.elementFromPoint(
            this.engine.input.pointers.primary.lastScreenPos.x,
            this.engine.input.pointers.primary.lastScreenPos.y
        );

        return hoveredElement?.closest("[data-game-ui]") !== null;
    }

    private pointerDownHandler = (evt: ex.PointerEvent) => {
        if (isTypingInInput()) return;
        if (this.isPointerOverUI()) return;

        if (evt.button === ex.PointerButton.Left) {
            this.isHolding = true;
        }

        if (evt.button === ex.PointerButton.Right) {
            this.startHeavyAttack();
        }
    };

    private pointerUpHandler = (evt: ex.PointerEvent) => {
        if (this.isPointerOverUI()) {
            this.isHolding = false;
            return;
        }

        if (evt.button === ex.PointerButton.Left) {
            this.isHolding = false;
        }

    };

    constructor(
        player: Player,
        engine: ex.Engine,
        private resources: GameResources,
        private collisionGroups: any,
        protected damage: number,
        private image: ex.ImageSource,
        private glow: boolean,
        protected weaponItem: Weapon,
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5), // exvec(0.5, 0.7)
            width: image.width * 2.7,
            height: image.height * 2.7,
            z: 4,
        });

        this.player = player;
        this.engine = engine;
        this.offset = ex.vec(46, 0);
    }

    onInitialize(engine: ex.Engine): void {
        this.engine = engine;

        multiplayer.setLocalWeapon(this);

        const sprite = this.image.toSprite();

        sprite.width = this.width;
        sprite.height = this.height;

        this.graphics.use(sprite);

        if (!this.shadow || this.shadow.isKilled()) {
            this.shadow = new Shadow(this);
        }

        if (!this.swingTracer || this.swingTracer.isKilled()) {
            this.swingTracer = new SwingTracer();
        }

        if (!this.thrustTracer || this.thrustTracer.isKilled()) {
            this.thrustTracer = new ThrustTracer();
        }

        this.addListeners();
    }

    private lastSwingEndPos: ex.Vector | null = null;
    private lastSwingEndAngle = 0;
    private debugNextIdleFrame = false;

    onPostUpdate(_engine: ex.Engine, delta: number) {

        if (this.isHolding) {
            this.requestAttack();
        }

        this.swingTracer?.updateTracer(this.engine, delta);
        this.thrustTracer?.updateTracer(this.engine, delta);

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        if (this.thrusting) {
            this.updateThrust(delta);
            return;
        }

        if (this.heavyAttacking) {
            this.updateHeavyAttack(delta);
            return;
        }

        // -------------------------------
        //   SWINGING LOGIC
        // -------------------------------
        if (this.swinging) {
            this.swingProgress += delta;

            const t = Math.min(this.swingProgress / this.swingDuration, 1);
            const eased = this.heavySwingEase(t);

            const currentMouseAngle = this.getMouseAngle();
            if (currentMouseAngle === null) return;

            const dynamicStartAngle = currentMouseAngle + this.swingStartOffset;
            const dynamicEndAngle = currentMouseAngle + this.swingEndOffset;

            this.orbitAngle =
                dynamicStartAngle +
                (dynamicEndAngle - dynamicStartAngle) * eased;

            if (!Number.isFinite(this.orbitAngle)) {

                this.swinging = false;
                return;
            }

            const rotatedOffset = this.offset
                .clone()
                .rotate(this.orbitAngle)
                .add(ex.vec(0, 5));

            const bobbedOffset = addBobbing(rotatedOffset);

            this.pos = this.player.pos.clone().add(bobbedOffset);
            this.rotation = this.orbitAngle + this.ROT_OFFSET;

            if (this.shadow) {
                this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
            }

            if (t >= 1) {
                this.lastSwingEndPos = this.pos.clone();
                this.lastSwingEndAngle = this.orbitAngle;
                this.debugNextIdleFrame = true;

                this.swinging = false;
                this.orbitAngle = dynamicEndAngle;

                console.log("SWING END", {
                    pos: {
                        x: this.pos.x,
                        y: this.pos.y,
                    },
                    orbitAngle: this.orbitAngle,
                    mouseAngle: currentMouseAngle,
                    idleOrbitAngleOffset: this.idleOrbitAngleOffset,
                    swingEndOffset: this.swingEndOffset,
                });
            }

            return;
        }


        // -------------------------------
        //   IDLE LOGIC
        // -------------------------------
        this.orbitAngle = mouseAngle + this.idleOrbitAngleOffset;

        const rotatedOffset = this.offset
            .clone()
            .rotate(this.orbitAngle)
            .add(ex.vec(0, 5));

        // ADD BOBBING HERE TOO
        const bobbedOffset = addBobbing(rotatedOffset);

        const nextPos = this.player.pos.clone().add(bobbedOffset);

        if (!Number.isFinite(nextPos.x) || !Number.isFinite(nextPos.y)) {
            console.error("Invalid sword pos", {
                nextPos,
                playerPos: this.player.pos,
                offset: this.offset,
                orbitAngle: this.orbitAngle,
                bobbedOffset,
            });
            return;
        }

        this.pos = nextPos;
        this.rotation = this.orbitAngle + this.ROT_OFFSET;

        if (this.debugNextIdleFrame && this.lastSwingEndPos) {
            const diff = this.pos.sub(this.lastSwingEndPos);

            console.log("FIRST IDLE FRAME AFTER SWING", {
                pos: {
                    x: this.pos.x,
                    y: this.pos.y,
                },
                lastSwingEndPos: {
                    x: this.lastSwingEndPos.x,
                    y: this.lastSwingEndPos.y,
                },
                diff: {
                    x: diff.x,
                    y: diff.y,
                    distance: diff.magnitude,
                },
                idleOrbitAngle: this.orbitAngle,
                lastSwingEndAngle: this.lastSwingEndAngle,
                angleDiff: this.orbitAngle - this.lastSwingEndAngle,
                mouseAngle,
                idleOrbitAngleOffset: this.idleOrbitAngleOffset,
            });

            this.debugNextIdleFrame = false;
        }

        // shadow update
        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
        }
    }

    private heavySwingEase(t: number) {
        if (!Number.isFinite(t)) return 0;

        t = Math.max(0, Math.min(t, 1));

        const startPortion = 0.35; // how much TIME is spent easing in
        const middlePortion = 0.30; // how much TIME is spent fast
        const endPortion = 0.35; // how much TIME is spent easing out

        const startDistance = 0.08; // how much ARC the start covers
        const middleDistance = 0.84; // how much ARC the fast middle covers
        const endDistance = 0.08; // how much ARC the end covers

        const startPower = 2.8;
        const endPower = 2.8;

        const middleStart = startPortion;
        const endStart = startPortion + middlePortion;

        if (t < middleStart) {
            const p = t / startPortion;
            return startDistance * Math.pow(p, startPower);
        }

        if (t < endStart) {
            const p = (t - middleStart) / middlePortion;
            return startDistance + middleDistance * p;
        }

        const p = (t - endStart) / endPortion;
        const easedOut = 1 - Math.pow(1 - p, endPower);

        return startDistance + middleDistance + endDistance * easedOut;
    }

    protected getMouseAngle(): number | null {
        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return null;

        const worldPos = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const dir = worldPos.sub(this.player.pos);
        return dir.toAngle();
    }

    onCollisionStart(_self: ex.Collider, other: ex.Collider) {
        console.log("Sword collided with:", other.owner?.name);

        const enemy = other.owner;

        if (!(enemy instanceof Demon)) return;

        console.log("Sword hit enemy:", enemy.enemyId);

        this.onSwordHitEnemy(enemy.enemyId);
    }

    private onSwordHitEnemy(enemyId: string) {
        if (
            !this.swinging &&
            !this.thrusting
        ) {
            return;
        }

        const aimAngle =
            this.getMouseAngle();

        if (aimAngle === null) {
            return;
        }

        this.sendOrQueueSwordHit({
            enemyId,

            hitT: Math.min(
                this.swingProgress /
                this.swingDuration,
                1
            ),

            aimAngle,
            attackType: "normal",
        });
    }

    private sendOrQueueSwordHit(
        hit: PendingSwordHit
    ) {
        if (
            this.hitEnemiesThisAttack.has(
                hit.enemyId
            )
        ) {
            return;
        }

        /*
         * Reserve the enemy immediately so repeated
         * collision callbacks do not create duplicate entries.
         */
        this.hitEnemiesThisAttack.add(
            hit.enemyId
        );

        if (
            this.currentServerAttackId ===
            null
        ) {
            this.pendingHits.set(
                hit.enemyId,
                hit
            );

            return;
        }

        multiplayer.sendSwordHit({
            serverAttackId:
                this.currentServerAttackId,

            ...hit,
        });
    }

    private flushPendingHits() {
        if (
            this.currentServerAttackId ===
            null
        ) {
            return;
        }

        for (
            const hit of
            this.pendingHits.values()
        ) {
            multiplayer.sendSwordHit({
                serverAttackId:
                    this.currentServerAttackId,

                ...hit,
            });
        }

        this.pendingHits.clear();
    }

    /*
    playServerAttack(data: ServerAttack) {
        this.waitingForAttack = false;

        this.predictedComboIndex =
            (data.comboIndex + 1) % this.predictedCombo.length;

        this.lastPredictedAttackTime = performance.now();

        if (this.swinging || this.thrusting) {
            return;
        }

        if (data.attack.type === "slash") {
            this.startSlash(data);
        } else {
            this.startThrust(data);
        }
    }
    */

    public confirmServerAttack(data: ServerAttack) {
        /*
         * Ignore acknowledgements for an older local attack.
         */
        if (data.clientAttackId !== this.currentAttackId) {
            console.log("Ignoring stale attack confirmation", {
                receivedClientAttackId: data.clientAttackId,
                currentClientAttackId: this.currentAttackId,
            });

            return;
        }

        this.currentServerAttackId =
            data.serverAttackId;

        this.waitingForAttack = false;

        if (
            data.attackType === "normal" &&
            Number.isFinite(data.comboIndex)
        ) {
            this.predictedComboIndex =
                (data.comboIndex + 1) %
                this.predictedCombo.length;
        }

        this.lastPredictedAttackTime =
            performance.now();

        this.flushPendingHits();
    }

    private requestAttack() {
        if (this.waitingForAttack) return;
        if (this.heavyAttacking) return;
        if (this.swinging || this.thrusting) return;

        const aimAngle = this.getMouseAngle();
        if (aimAngle === null) return;

        const now = performance.now();

        if (now - this.lastPredictedAttackTime > this.comboThreshold) {
            this.predictedComboIndex = 0;
        }

        const comboIndex = Number.isFinite(this.predictedComboIndex)
            ? this.predictedComboIndex
            : 0;

        const attack = this.predictedCombo[comboIndex];

        if (!attack) {
            console.error("Missing predicted attack", {
                comboIndex,
                predictedComboIndex: this.predictedComboIndex,
                predictedCombo: this.predictedCombo,
            });

            this.predictedComboIndex = 0;
            return;
        }

        this.currentAttackId++;
        this.currentServerAttackId = null;
        this.hitEnemiesThisAttack.clear();
        this.pendingHits.clear();

        const predictedAttack: PredictedAttack = {
            clientAttackId: this.currentAttackId,
            weaponId: this.weaponItem.id,
            aimAngle,
            comboIndex,
            attack,
        };

        console.log("PREDICTED ATTACK: ", predictedAttack)

        this.playPredictedAttack(predictedAttack);

        this.lastPredictedAttackTime = now;
        this.predictedComboIndex =
            (comboIndex + 1) % this.predictedCombo.length;

        this.waitingForAttack = true;

        this.currentAttackId++;
        this.currentServerAttackId = null;
        this.hitEnemiesThisAttack.clear();
        this.pendingHits.clear();

        multiplayer.sendWeaponAttack({
            attackId: this.currentAttackId,
            weaponId: this.weaponItem.id,
            aimAngle,
            attackType: "normal",
        });

        window.setTimeout(() => {
            this.waitingForAttack = false;
        }, attack.cooldown);
    }

    private playPredictedAttack(data: ServerAttack) {
        if (data.attack.type === "slash") {
            this.startSlash(data);
        } else {
            this.startThrust(data);
        }
    }

    protected startSlash(data: ServerAttack) {
        const attack = data.attack;
        const aimAngle = data.aimAngle;

        this.swinging = true;
        this.thrusting = false;
        this.swingProgress = 0;

        this.swingDuration = Number.isFinite(attack.duration) && attack.duration > 0
            ? attack.duration
            : 250;

        this.graphics.flipHorizontal = attack.swingFlip ?? false;

        this.swingStartOffset = Number.isFinite(attack.startOffset)
            ? attack.startOffset!
            : 0;

        this.swingEndOffset = Number.isFinite(attack.endOffset)
            ? attack.endOffset!
            : 0;

        this.swingStartAngle = aimAngle + this.swingStartOffset;
        this.swingEndAngle = aimAngle + this.swingEndOffset;

        this.idleOrbitAngleOffset = this.swingEndOffset;
        this.orbitAngle = this.swingStartAngle;

        this.swingTracer.start(
            this.player,
            this.swingStartOffset,
            this.swingEndOffset,
            this.swingDuration,
            this.offset.x,
            () => this.player.pos.clone()
                .add(ex.vec(0, this.player.bobOffsetY))
                .add(ex.vec(0, 5)),
            () => this.getMouseAngle(),
        );
    }

    private startThrust(data: ServerAttack) {
        const attack = data.attack;
        const aimAngle = data.aimAngle;

        this.thrusting = true;
        this.swinging = false;
        this.swingProgress = 0;

        this.swingDuration = attack.duration;
        this.thrustDirection = ex.Vector.fromAngle(aimAngle);
        this.thrustDistance = attack.thrustDistance ?? 55;

        const base = this.player.pos
            .clone()
            .add(this.thrustDirection.scale(this.height * 0.35))
            .add(ex.vec(0, this.player.bobOffsetY))
            .add(ex.vec(0, 5));

        const tipStart = base.add(
            this.thrustDirection.scale(this.height - 50)
        );

        const tipEnd = tipStart.add(
            this.thrustDirection.scale(this.thrustDistance + 35)
        );

        this.thrustTracer.startTrace(tipStart, tipEnd, aimAngle);
    }

    private updateThrust(delta: number) {
        this.swingProgress += delta;

        const forwardTime = 45;
        const retractTime = 100;
        const total = this.swingDuration;
        const pauseTime = Math.max(0, total - forwardTime - retractTime);

        const t = Math.min(this.swingProgress, total);

        let thrustT = 0;

        if (t < forwardTime) {
            // thrust outward
            const p = t / forwardTime;
            thrustT = p * p * (3 - 2 * p);
        } else if (t < forwardTime + pauseTime) {
            // hold at peak
            thrustT = 1;
        } else {
            // retract back
            const p = (t - forwardTime - pauseTime) / retractTime;
            thrustT = 1 - p * p * (3 - 2 * p);
        }

        const baseOffset = this.thrustDirection.scale(this.height * 0.4);
        const thrustOffset = this.thrustDirection.scale(this.thrustDistance * thrustT);

        this.pos = this.player.pos
            .clone()
            .add(baseOffset)
            .add(thrustOffset)
            .add(ex.vec(0, this.player.bobOffsetY))
            .add(ex.vec(0, 5));

        this.rotation = this.thrustDirection.toAngle() + this.ROT_OFFSET;

        const thrustAngle = this.thrustDirection.toAngle();

        const swordTipStart = this.pos.clone().add(
            this.thrustDirection.scale(this.height * 0.25)
        );

        const swordTipEnd = swordTipStart.clone().add(
            this.thrustDirection.scale(this.thrustDistance + 35)
        );

        this.thrustTracer.updateTrace(
            swordTipStart,
            swordTipEnd,
            thrustAngle
        );

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
        }

        if (this.swingProgress >= total) {
            this.thrusting = false;
            this.swingProgress = 0;
        }
    }

    protected startHeavyAttack() {
        this.isHolding = false;

        if (this.heavyAttacking) {
            return;
        }

        const now = performance.now();

        if (
            now - this.lastHeavyAttackTime <
            this.HEAVY_ATTACK_COOLDOWN
        ) {
            return;
        }

        const aimAngle = this.getMouseAngle();
        if (aimAngle === null) return;

        /*
         * Cancel any current normal attack.
         */
        this.swinging = false;
        this.thrusting = false;
        this.swingProgress = 0;

        this.lastHeavyAttackTime = now;
        this.heavyAttacking = true;
        this.heavyAttackProgress = 0;
        this.heavyAttackAimAngle = aimAngle;
        this.heavySlashSpawned = false;

        this.currentAttackId++;
        this.currentServerAttackId = null;
        this.hitEnemiesThisAttack.clear();
        this.pendingHits.clear();

        this.swingStartOffset = Math.PI * 0.9;
        this.swingEndOffset = -Math.PI * 0.9;
        this.graphics.flipHorizontal = false;

        this.swingTracer.start(
            this.player,
            this.swingStartOffset,
            this.swingEndOffset,
            this.HEAVY_ATTACK_DURATION,
            this.offset.x,
            () => this.player.pos.clone()
                .add(ex.vec(0, this.player.bobOffsetY))
                .add(ex.vec(0, 5)),
            () => this.getMouseAngle(),
        );
    }

    private updateHeavyAttack(delta: number) {
        this.heavyAttackProgress += delta;

        const t = Math.min(
            this.heavyAttackProgress /
            this.HEAVY_ATTACK_DURATION,
            1
        );

        const eased = this.heavySwingEase(t);

        /*
         * Continuously follow the mouse during the heavy swing,
         * just like the normal attack.
         */
        const currentMouseAngle = this.getMouseAngle();

        if (currentMouseAngle === null) {
            return;
        }

        this.heavyAttackAimAngle = currentMouseAngle;

        const dynamicStartAngle =
            currentMouseAngle + this.swingStartOffset;

        const dynamicEndAngle =
            currentMouseAngle + this.swingEndOffset;

        this.orbitAngle =
            dynamicStartAngle +
            (dynamicEndAngle - dynamicStartAngle) *
            eased;

        if (!Number.isFinite(this.orbitAngle)) {
            this.heavyAttacking = false;
            this.heavyAttackProgress = 0;
            return;
        }

        const rotatedOffset = this.offset
            .clone()
            .rotate(this.orbitAngle)
            .add(ex.vec(0, 5));

        const bobbedOffset = rotatedOffset.add(
            ex.vec(0, this.player.bobOffsetY)
        );

        this.pos = this.player.pos
            .clone()
            .add(bobbedOffset);

        this.rotation =
            this.orbitAngle + this.ROT_OFFSET;

        if (this.shadow) {
            this.shadow.pos = this.pos.add(
                ex.vec(0, this.height / 2.5)
            );
        }

        if (
            !this.heavySlashSpawned &&
            this.heavyAttackProgress >=
            this.HEAVY_ATTACK_RELEASE_TIME
        ) {
            this.heavySlashSpawned = true;

            multiplayer.sendWeaponAttack({
                attackId: this.currentAttackId,
                weaponId: this.weaponItem.id,
                aimAngle: this.heavyAttackAimAngle,
                attackType: "heavy",
            });

            /*
             * heavyAttackAimAngle now contains the current
             * mouse angle at the moment of release.
             */
            this.spawnHeavySlash();
        }

        if (t >= 1) {
            this.heavyAttacking = false;
            this.heavyAttackProgress = 0;
            this.idleOrbitAngleOffset =
                this.swingEndOffset;

            /*
             * End at the current mouse-relative end offset.
             */
            this.orbitAngle = dynamicEndAngle;
        }
    }

    private spawnHeavySlash() {
        const direction = ex.Vector.fromAngle(this.heavyAttackAimAngle);
        const spawnPos = this.player.pos
            .clone()
            .add(direction.scale(85))
            .add(ex.vec(0, this.player.bobOffsetY));

        const slash = new HeavySlashProjectile({
            pos: spawnPos,
            angle: this.heavyAttackAimAngle,
            speed: this.HEAVY_SLASH_SPEED,
            maxDistance: this.HEAVY_SLASH_DISTANCE,
            onEnemyHit: (enemyId) => {
                this.sendOrQueueSwordHit({
                    enemyId,
                    hitT: 1,
                    aimAngle:
                        this.heavyAttackAimAngle,
                    attackType: "heavy",
                });
            },
        });

        this.engine.currentScene.add(slash);
    }

    protected onSuccessfulHit(_target: ex.Actor) { }

    public addListeners(): void {
        if (this.listenersAttached) {
            return;
        }

        const pointer = this.engine.input.pointers.primary;

        pointer.on("down", this.pointerDownHandler);
        pointer.on("up", this.pointerUpHandler);

        this.listenersAttached = true;
    }

    private removeListeners(): void {
        if (!this.listenersAttached) {
            return;
        }

        const pointer = this.engine.input.pointers.primary;

        pointer.off("down", this.pointerDownHandler);
        pointer.off("up", this.pointerUpHandler);

        this.listenersAttached = false;
    }

    cleanup() {
        multiplayer.setLocalWeapon(null);

        const pointer = this.engine.input.pointers.primary;

        pointer.off("down", this.pointerDownHandler);
        pointer.off("up", this.pointerUpHandler);

        this.isHolding = false;
        this.heavyAttacking = false;
        this.shadow.kill();
        this.swingTracer.kill();
        this.thrustTracer.kill();
    }

    public attachToScene(scene: ex.Scene): void {
        // -------------------------
        // Weapon actor
        // -------------------------
        if (
            this.scene &&
            this.scene !== scene
        ) {
            this.scene.remove(this);
        }

        if (this.scene !== scene) {
            scene.add(this);
        }

        // -------------------------
        // Weapon shadow
        // -------------------------
        if (
            !this.shadow ||
            this.shadow.isKilled()
        ) {
            this.shadow = new Shadow(this);
        }

        if (
            this.shadow.scene &&
            this.shadow.scene !== scene
        ) {
            this.shadow.scene.remove(
                this.shadow
            );
        }

        if (this.shadow.scene !== scene) {
            scene.add(this.shadow);
        }

        // -------------------------
        // Swing tracer
        // -------------------------
        if (
            !this.swingTracer ||
            this.swingTracer.isKilled()
        ) {
            this.swingTracer =
                new SwingTracer();
        }

        if (
            this.swingTracer.scene &&
            this.swingTracer.scene !== scene
        ) {
            this.swingTracer.scene.remove(
                this.swingTracer
            );
        }

        if (
            this.swingTracer.scene !== scene
        ) {
            scene.add(this.swingTracer);
        }

        // -------------------------
        // Thrust tracer
        // -------------------------
        if (
            !this.thrustTracer ||
            this.thrustTracer.isKilled()
        ) {
            this.thrustTracer =
                new ThrustTracer();
        }

        if (
            this.thrustTracer.scene &&
            this.thrustTracer.scene !== scene
        ) {
            this.thrustTracer.scene.remove(
                this.thrustTracer
            );
        }

        if (
            this.thrustTracer.scene !== scene
        ) {
            scene.add(this.thrustTracer);
        }

        multiplayer.setLocalWeapon(this);

        this.addListeners();

        console.log("Weapon scene attachment:", {
            weaponAttached:
                this.scene === scene,
            shadowAttached:
                this.shadow.scene === scene,
            swingTracerAttached:
                this.swingTracer.scene === scene,
            thrustTracerAttached:
                this.thrustTracer.scene === scene,
            weaponScene: this.scene,
            shadowScene: this.shadow.scene,
            targetScene: scene,
        });
    }

    public detachFromScene(
        scene: ex.Scene
    ): void {
        this.removeListeners();

        this.isHolding = false;
        this.swinging = false;
        this.thrusting = false;
        this.heavyAttacking = false;

        // This was missing.
        if (this.shadow?.scene === scene) {
            scene.remove(this.shadow);
        }

        if (
            this.swingTracer?.scene === scene
        ) {
            scene.remove(this.swingTracer);
        }

        if (
            this.thrustTracer?.scene === scene
        ) {
            scene.remove(this.thrustTracer);
        }

        if (this.scene === scene) {
            scene.remove(this);
        }

        multiplayer.setLocalWeapon(null);
    }
}

export class HeavySlashProjectile extends ex.Actor {
    private readonly direction: ex.Vector;
    private readonly startPos: ex.Vector;
    private readonly hitEnemyIds = new Set<string>();

    constructor(config: {
        pos: ex.Vector;
        angle: number;
        speed: number;
        maxDistance: number;
        onEnemyHit: (enemyId: string) => void;
    }) {
        const slashWidth = 170;
        const slashDepth = 58;

        super({
            name: "heavy-slash-projectile",
            pos: config.pos.clone(),
            width: slashDepth + 100,
            height: slashWidth,
            rotation: config.angle,
            anchor: ex.vec(0.5, 0.5),
            z: 3,
            collisionType: ex.CollisionType.Passive,
        });

        this.direction = ex.Vector.fromAngle(config.angle);
        this.startPos = config.pos.clone();
        this.vel = this.direction.scale(config.speed);

        const halfHeight = 100;
        const curveDepth = 60;

        const createCurvedSlashGraphic = (
            thickness: number,
            color: ex.Color
        ): ex.Polygon => {
            const segmentCount = 80;

            const frontPoints: ex.Vector[] = [];
            const backPoints: ex.Vector[] = [];

            for (let i = 0; i <= segmentCount; i++) {
                const t = i / segmentCount;

                const y = ex.lerp(
                    -halfHeight,
                    halfHeight,
                    t
                );

                const curveShape =
                    Math.sin(t * Math.PI);

                const centerX =
                    -38 + curveShape * curveDepth;

                const widthShape = Math.pow(
                    Math.sin(t * Math.PI),
                    0.65
                );

                const halfThickness =
                    (thickness * widthShape) / 2;

                frontPoints.push(
                    ex.vec(
                        centerX + halfThickness,
                        y
                    )
                );

                backPoints.push(
                    ex.vec(
                        centerX - halfThickness,
                        y
                    )
                );
            }

            return new ex.Polygon({
                points: [
                    ...frontPoints,
                    ...backPoints.reverse(),
                ],
                color,
            });
        };

        const afterImageSettings = [
            {
                offset: -60,
                thickness: 30,
                opacity: 0.07,
            },
            {
                offset: -50,
                thickness: 29,
                opacity: 0.12,
            },
            {
                offset: -40,
                thickness: 28,
                opacity: 0.18,
            },
            {
                offset: -30,
                thickness: 27,
                opacity: 0.25,
            },
            {
                offset: -20,
                thickness: 26,
                opacity: 0.33,
            },
            {
                offset: -10,
                thickness: 25,
                opacity: 0.42,
            },
        ];

        const afterImageMembers =
            afterImageSettings.map((afterImage) => ({
                graphic: createCurvedSlashGraphic(
                    afterImage.thickness,
                    ex.Color.fromRGB(
                        255,
                        255,
                        255,
                        afterImage.opacity
                    )
                ),
                offset: ex.vec(
                    afterImage.offset,
                    0
                ),
            }));

        const mainBody =
            createCurvedSlashGraphic(
                24,
                ex.Color.White
            );

        const innerCore =
            createCurvedSlashGraphic(
                12,
                ex.Color.White
            );

        const slashGraphic =
            new ex.GraphicsGroup({
                members: [
                    ...afterImageMembers,
                    {
                        graphic: mainBody,
                        offset: ex.vec(0, 0),
                    },
                    {
                        graphic: innerCore,
                        offset: ex.vec(0, 0),
                    },
                ],
            });

        this.graphics.use(slashGraphic);

        this.on("collisionstart", (evt) => {
            const enemy = evt.other.owner;

            if (!(enemy instanceof Demon)) {
                return;
            }

            if (
                this.hitEnemyIds.has(enemy.enemyId)
            ) {
                return;
            }

            this.hitEnemyIds.add(enemy.enemyId);

            config.onEnemyHit(enemy.enemyId);
        });

        this.on("postupdate", () => {
            const traveledDistance =
                this.pos.distance(this.startPos);

            if (
                traveledDistance >=
                config.maxDistance
            ) {
                this.kill();
            }
        });
    }
}

/*

export class HeavySlashProjectile extends ex.Actor {
    private readonly direction: ex.Vector;
    private readonly startPos: ex.Vector;
    private readonly hitEnemyIds = new Set<string>();

    constructor(config: {
        pos: ex.Vector;
        angle: number;
        speed: number;
        maxDistance: number;
        onEnemyHit: (enemyId: string) => void;
    }) {
        const slashWidth = 170;
        const slashDepth = 58;

        super({
            name: "heavy-slash-projectile",
            pos: config.pos.clone(),

            // Increase the width because the trail extends behind it.
            width: slashDepth + 100,
            height: slashWidth,

            rotation: config.angle,
            anchor: ex.vec(0.5, 0.5),
            z: 3,
            collisionType: ex.CollisionType.Passive,
        });

        this.direction =
            ex.Vector.fromAngle(config.angle);

        this.startPos = config.pos.clone();

        this.vel =
            this.direction.scale(config.speed);

        const halfHeight = 100;
        const curveDepth = 60;

        const createCurvedSlashGraphic = (
            thickness: number,
            color: ex.Color
        ): ex.Polygon => {
            const segmentCount = 80;

            const frontPoints: ex.Vector[] = [];
            const backPoints: ex.Vector[] = [];

            for (let i = 0; i <= segmentCount; i++) {
                const t = i / segmentCount;

                const y = ex.lerp(
                    -halfHeight,
                    halfHeight,
                    t
                );

                const curveShape =
                    Math.sin(t * Math.PI);

                const centerX =
                    -38 + curveShape * curveDepth;

                const widthShape = Math.pow(
                    Math.sin(t * Math.PI),
                    0.65
                );

                const halfThickness =
                    (thickness * widthShape) / 2;

                frontPoints.push(
                    ex.vec(
                        centerX + halfThickness,
                        y
                    )
                );

                backPoints.push(
                    ex.vec(
                        centerX - halfThickness,
                        y
                    )
                );
            }

            const points = [
                ...frontPoints,
                ...backPoints.reverse(),
            ];

            return createPolygonWithLocalOrigin(
                points,
                color
            );
        };

        const createHeavySlashTracer = (
            trailLength: number,
            color: ex.Color
        ): ex.Polygon => {
            const points = [
                // Top tip of the slash
                ex.vec(-38, -100),

                // Front-middle of the slash
                ex.vec(22, 0),

                // Bottom tip of the slash
                ex.vec(-38, 100),

                // Bottom-rear taper
                ex.vec(-58, 70),

                // Trailing point
                ex.vec(-38 - trailLength, 0),

                // Top-rear taper
                ex.vec(-58, -70),
            ];

            return createPolygonWithLocalOrigin(
                points,
                color
            );
        };

        const createPolygonWithLocalOrigin = (
            points: ex.Vector[],
            color: ex.Color
        ): ex.Polygon => {
            const minX = Math.min(...points.map((point) => point.x));
            const minY = Math.min(...points.map((point) => point.y));

            const polygon = new ex.Polygon({
                points,
                color,
            });

            polygon.origin = ex.vec(
                -minX,
                -minY
            );

            return polygon;
        };

        const tracer = createHeavySlashTracer(
            110,
            ex.Color.fromRGB(
                255,
                255,
                255,
                0.16
            )
        );

        const afterImageSettings = [
            { offset: -60, thickness: 30, opacity: 0.07 },
            { offset: -50, thickness: 29, opacity: 0.12 },
            { offset: -40, thickness: 28, opacity: 0.18 },
            { offset: -30, thickness: 27, opacity: 0.25 },
            { offset: -20, thickness: 26, opacity: 0.33 },
            { offset: -10, thickness: 25, opacity: 0.42 },
        ];

        const afterImageMembers = afterImageSettings.map((afterImage) => ({
            graphic: createCurvedSlashGraphic(
                afterImage.thickness,
                ex.Color.fromRGB(
                    255,
                    255,
                    255,
                    afterImage.opacity
                )
            ),
            offset: ex.vec(afterImage.offset, 0),
        }));

        const mainBody = createCurvedSlashGraphic(
            24,
            ex.Color.White
        );

        const innerCore = createCurvedSlashGraphic(
            12,
            ex.Color.White
        );

        const slashGraphic = new ex.GraphicsGroup({
            members: [
                {
                    graphic: tracer,
                    offset: ex.vec(-110, 0),
                    useBounds: false,
                },
                {
                    graphic: mainBody,
                    offset: ex.vec(0, 0),
                    useBounds: true,
                },
                {
                    graphic: innerCore,
                    offset: ex.vec(0, 0),
                    useBounds: true,
                },
            ],
        });

        this.graphics.use(slashGraphic);

        this.on("collisionstart", (evt) => {
            const enemy = evt.other.owner;

            if (!(enemy instanceof Demon)) {
                return;
            }

            if (
                this.hitEnemyIds.has(enemy.enemyId)
            ) {
                return;
            }

            this.hitEnemyIds.add(enemy.enemyId);

            config.onEnemyHit(enemy.enemyId);
        });

        this.on("postupdate", () => {
            const traveledDistance =
                this.pos.distance(this.startPos);

            if (
                traveledDistance >=
                config.maxDistance
            ) {
                this.kill();
            }
        });
    }
}
*/
type SwingTrailSegment = {
    angle: number;
    age: number;
    lifetime: number;
    swingT: number;
};

export class SwingTracer extends ex.Actor {
    public active = false;

    private player!: ex.Actor;
    private startOffset = 0;
    private endOffset = 0;
    private getAimAngle: (() => number | null) | null = null;
    private progress = 0;
    private duration = 10;
    private radius = 160;
    private getOrigin!: () => ex.Vector;

    private segments: SwingTrailSegment[] = [];
    private segmentLifetime = 80;
    private lastProgress = 0;

    constructor() {
        super({
            name: "swing-tracer",
            pos: ex.vec(0, 0),
            z: 3,
            collisionType: ex.CollisionType.PreventCollision,
        });

        this.graphics.onPostDraw = (ctx) => {
            if (!this.active || !this.player) return;

            const origin = this.getOrigin();

            const baseInner = this.radius - 30;
            const baseOuter = this.radius + 40;
            const maxWidth = baseOuter - baseInner;

            for (const segment of this.segments) {
                const lifeT = Math.min(segment.age / segment.lifetime, 1);
                const fade = 1 - lifeT;
                const alpha = fade * 0.45;

                const swingShape = Math.sin(segment.swingT * Math.PI);
                const width = maxWidth * swingShape * fade;

                const outer = baseOuter;
                const inner = baseOuter - width;

                const p1 = origin
                    .add(ex.Vector.fromAngle(segment.angle).scale(inner))
                    .sub(this.pos);

                const p2 = origin
                    .add(ex.Vector.fromAngle(segment.angle).scale(outer))
                    .sub(this.pos);

                ctx.save();
                ctx.opacity = alpha;
                ctx.drawLine(p1, p2, ex.Color.White, 8);
                ctx.restore();
            }
        };
    }

    start(
        player: ex.Actor,
        startOffset: number,
        endOffset: number,
        duration: number,
        radius: number,
        getOrigin: () => ex.Vector,
        getAimAngle: () => number | null,
    ) {
        this.player = player;
        this.startOffset = startOffset;
        this.endOffset = endOffset;
        this.duration = duration;
        this.radius = radius;
        this.getOrigin = getOrigin;
        this.getAimAngle = getAimAngle;

        this.progress = 0;
        this.segments = [];
        this.active = true;
        this.lastProgress = 0;
    }

    updateTracer(engine: ex.Engine, delta: number) {
        if (!this.active) return;

        this.pos = engine.currentScene.camera.pos.clone();

        this.progress += delta;

        const stillSwinging = this.progress < this.duration;

        if (stillSwinging) {
            const aimAngle = this.getAimAngle?.();
            if (aimAngle === null || aimAngle === undefined) return;

            const prevProgress = this.lastProgress;
            const currProgress = Math.min(this.progress, this.duration);

            const angleSteps = 30;

            for (let i = 0; i < angleSteps; i++) {
                const p = i / angleSteps;

                const sampleProgress =
                    prevProgress + (currProgress - prevProgress) * p;

                const t = Math.min(sampleProgress / this.duration, 1);
                const eased = this.heavySwingEase(t);

                const dynamicStartAngle = aimAngle + this.startOffset;
                const dynamicEndAngle = aimAngle + this.endOffset;

                const angle =
                    dynamicStartAngle +
                    (dynamicEndAngle - dynamicStartAngle) * eased;

                this.segments.push({
                    angle,
                    age: 0,
                    lifetime: this.segmentLifetime,
                    swingT: t,
                });
            }

            this.lastProgress = currProgress;
        }

        for (const segment of this.segments) {
            segment.age += delta;
        }

        this.segments = this.segments.filter(
            segment => segment.age < segment.lifetime
        );

        if (!stillSwinging && this.segments.length === 0) {
            this.active = false;
        }
    }

    private heavySwingEase(t: number) {
        t = Math.max(0, Math.min(t, 1));

        const startPortion = 0.35;
        const middlePortion = 0.30;
        const endPortion = 0.35;

        const startDistance = 0.08;
        const middleDistance = 0.84;
        const endDistance = 0.08;

        const startPower = 2.8;
        const endPower = 2.8;

        const middleStart = startPortion;
        const endStart = startPortion + middlePortion;

        if (t < middleStart) {
            const p = t / startPortion;
            return startDistance * Math.pow(p, startPower);
        }

        if (t < endStart) {
            const p = (t - middleStart) / middlePortion;
            return startDistance + middleDistance * p;
        }

        const p = (t - endStart) / endPortion;
        const easedOut = 1 - Math.pow(1 - p, endPower);

        return startDistance + middleDistance + endDistance * easedOut;
    }
}

export class ThrustTracer extends ex.Actor {
    private active = false;
    private start = ex.vec(0, 0);
    private end = ex.vec(0, 0);
    private progress = 0;
    private duration = 100;
    private angle = 0;

    constructor() {
        super({
            name: "thrust-tracer",
            pos: ex.vec(0, 0),
            anchor: ex.vec(0, 0),
            z: 3,
            collisionType: ex.CollisionType.PreventCollision,
        });

        this.graphics.onPostDraw = (ctx) => {
            if (!this.active) return;

            const t = Math.min(this.progress / this.duration, 1);
            const eased = t * t * (3 - 2 * t);
            const alpha = 1 - t;

            const localStart = this.start.sub(this.pos);
            const localEnd = this.end.sub(this.pos);

            const dir = ex.Vector.fromAngle(this.angle);
            const perp = ex.vec(-dir.y, dir.x);

            const thrustLength = localEnd.distance(localStart);
            const forwardDistance = thrustLength * eased;

            const tip = localStart
                .add(dir.scale(forwardDistance))
                .add(dir.scale(38));

            const chevronLength = 52;
            const chevronWidth = 30;

            const backCenter = tip.sub(dir.scale(chevronLength));

            const leftBack = backCenter.add(perp.scale(chevronWidth));
            const rightBack = backCenter.sub(perp.scale(chevronWidth));

            const leftTail = leftBack.sub(dir.scale(12)).add(perp.scale(4));
            const rightTail = rightBack.sub(dir.scale(12)).sub(perp.scale(4));

            const innerTip = tip.sub(dir.scale(6));
            const innerLeft = backCenter.add(perp.scale(chevronWidth * 0.55));
            const innerRight = backCenter.sub(perp.scale(chevronWidth * 0.55));

            const drawTaperedArm = (
                from: ex.Vector,
                to: ex.Vector,
                maxThickness: number,
                segments = 16
            ) => {
                for (let i = 0; i < segments; i++) {
                    const p1 = i / segments;
                    const p2 = (i + 1) / segments;

                    const a = from.lerp(to, p1);
                    const b = from.lerp(to, p2);

                    const mid = (p1 + p2) * 0.5;

                    // Thin at tail, thick near the chevron tip, sharp at the very end
                    const thicknessShape =
                        Math.pow(mid, 0.45) * (1 - Math.pow(mid, 8));

                    const thickness = Math.max(
                        1,
                        maxThickness * thicknessShape
                    );

                    ctx.drawLine(a, b, ex.Color.White, thickness);
                }
            };

            ctx.save();

            // Soft tapered glow
            ctx.opacity = alpha * 1;
            drawTaperedArm(leftTail, tip, 26, 18);
            drawTaperedArm(rightTail, tip, 26, 18);

            // Bright tapered chevron body
            ctx.opacity = alpha;
            drawTaperedArm(leftTail, tip, 8, 18);
            drawTaperedArm(rightTail, tip, 8, 18);

            // Inner sharp highlight
            ctx.opacity = alpha * 3;
            ctx.drawLine(innerLeft, innerTip, ex.Color.White, 2);
            ctx.drawLine(innerRight, innerTip, ex.Color.White, 2);

            ctx.restore();
        };
    }

    startTrace(start: ex.Vector, end: ex.Vector, angle: number) {
        this.start = start.clone();
        this.end = end.clone();
        this.angle = angle;
        this.progress = 0;
        this.active = true;
    }

    updateTracer(engine: ex.Engine, delta: number) {
        if (!this.active) return;

        this.pos = engine.currentScene.camera.pos.clone();
        this.progress += delta;

        if (this.progress >= this.duration) {
            this.active = false;
        }
    }

    updateTrace(start: ex.Vector, end: ex.Vector, angle: number) {
        if (!this.active) return;

        this.start = start.clone();
        this.end = end.clone();
        this.angle = angle;
    }
}
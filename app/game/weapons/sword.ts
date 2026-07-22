const ex = await import("excalibur");
import { GameResources } from '../resources';
import { Player } from '../player/player';
import {Shadow} from "../utils/shadow";
import {Demon} from "../enemies/demon";
import { Outline, EnchantEffect, EnchantedGlowEffect } from "../utils/swordOutline";
import {DemonBoss} from "../enemies/bosses/DemonBoss";
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
    attackId: number;
    weaponId: string;
    aimAngle: number;
    comboIndex: number;
    attack: Attack;
};

export class GreatSword extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector; // radius from player center

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

    protected isBlocking = false;
    public blockDamageMultiplier = 0.5;

    private swingStartOffset = 0;
    private swingEndOffset = 0;

    private waitingForAttack = false;

    private predictedComboIndex = 0;
    private lastPredictedAttackTime = 0;
    private comboThreshold = 600;
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
            this.startBlock();
        }
    };

    private pointerUpHandler = (evt: ex.PointerEvent) => {
        if (this.isPointerOverUI()) {
            this.isHolding = false;
            this.stopBlock();
            return;
        }

        if (evt.button === ex.PointerButton.Left) {
            this.isHolding = false;
        }

        if (evt.button === ex.PointerButton.Right) {
            this.stopBlock();
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
            width: image.width * 2.6,
            height: image.height * 2.6,
            z: 4,
        });

        this.player = player;
        this.engine = engine;
        this.offset = ex.vec(45, 0);
    }

    onInitialize(engine: ex.Engine) {
        const sprite = this.image.toSprite();
        sprite.width = this.width;
        sprite.height = this.height;

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

        this.graphics.use(sprite);

        this.swingTracer = new SwingTracer();
        engine.currentScene.add(this.swingTracer);

        this.thrustTracer = new ThrustTracer();
        engine.currentScene.add(this.thrustTracer);

        /*if (this.glow) {
            const outline = new Outline(engine);
            this.graphics.material = outline.outlineMaterial;
        }*/

        const effect = new EnchantedGlowEffect(engine);
        this.graphics.material = effect.material;
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

        if (this.isBlocking) {
            const blockDistance = 34;

            const blockDirection = ex.Vector.fromAngle(mouseAngle);
            const blockOffset = blockDirection.scale(blockDistance);
            const bobbedOffset = addBobbing(blockOffset);

            this.pos = this.player.pos.clone().add(bobbedOffset);

            // Angle the sword across the player's body
            const guardTilt = Math.PI / 4; // 45 degrees

            const isAimingLeft = blockDirection.x < 0;

            this.rotation = mouseAngle + Math.PI / 2 + (isAimingLeft ? guardTilt : -guardTilt);

            this.graphics.flipHorizontal = isAimingLeft;

            if (this.shadow) {
                this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
            }

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
        if (!this.swinging && !this.thrusting) return;
        if (this.hitEnemiesThisAttack.has(enemyId)) return;

        this.hitEnemiesThisAttack.add(enemyId);

        multiplayer.sendSwordHit({
            attackId: this.currentAttackId,
            enemyId,
            hitT: Math.min(this.swingProgress / this.swingDuration, 1),
            aimAngle: this.getMouseAngle(),
        });
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
        this.waitingForAttack = false;

        if (Number.isFinite(data.comboIndex)) {
            this.predictedComboIndex =
                (data.comboIndex + 1) % this.predictedCombo.length;
        }

        this.lastPredictedAttackTime = performance.now();
    }

    private requestAttack() {
        if (this.waitingForAttack) return;
        if (this.isBlocking) return;
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
        this.hitEnemiesThisAttack.clear();

        const predictedAttack: ServerAttack = {
            attackId: this.currentAttackId,
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

        multiplayer.sendWeaponAttack({
            attackId: this.currentAttackId,
            weaponId: this.weaponItem.id,
            aimAngle,
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

    protected startBlock() {
        this.isHolding = false;

        if (this.swinging || this.thrusting) {
            return;
        }

        this.isBlocking = true;
    }

    protected stopBlock() {
        this.isBlocking = false;

        //this.player.isBlocking = false;
        //this.player.damageMultiplier = 1;
    }

    protected onSuccessfulHit(_target: ex.Actor) {}


    addListeners() {
        //this.engine.input.pointers.primary.on("down", () => this.startSwing());
        const pointer = this.engine.input.pointers.primary;

        pointer.on("down", this.pointerDownHandler);
        pointer.on("up", this.pointerUpHandler);
    }
    
    cleanup() {
        const pointer = this.engine.input.pointers.primary;

        pointer.off("down", this.pointerDownHandler);
        pointer.off("up", this.pointerUpHandler);

        this.isHolding = false;
        this.shadow.kill();
        this.swingTracer.kill();
    }
    
    public attachToScene(scene: ex.Scene) {
        if (!this.shadow || this.shadow.isKilled()) {
            this.shadow = new Shadow(this);
        }
        scene.add(this.shadow);

        if (!this.swingTracer || this.swingTracer.isKilled()) {
            this.swingTracer = new SwingTracer();
        }
        scene.add(this.swingTracer);

        if (!this.thrustTracer || this.thrustTracer.isKilled()) {
            this.thrustTracer = new ThrustTracer();
        }
        scene.add(this.thrustTracer);
    }
}

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

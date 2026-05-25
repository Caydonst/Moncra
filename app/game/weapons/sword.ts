const ex = await import("excalibur");
import { GameResources } from '../resources';
import { Player } from '../player';
import {Shadow} from "../utils/shadow";
import {Demon} from "../enemies/demon";
import { Outline } from "../utils/swordOutline";
import {DemonBoss} from "../enemies/bosses/DemonBoss";
import { GameScene } from '../scenes/GameScene';

type AttackType = "slash" | "thrust";

type Attack = {
    type: AttackType;
    duration: number;
    cooldown: number;
    damageMultiplier: number;

    // slash only
    startOffset?: number;
    endOffset?: number;

    // thrust only
    thrustDistance?: number;
};

export class GreatSword extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector; // radius from player center

    // Swing state
    private swinging = false;
    private swingProgress = 0;
    private swingDuration = 250; // ms for full swing
    protected isHolding = false;

    private swingStartAngle = 0;
    private swingEndAngle = 0;

    private swingCooldown = 350;
    private lastSwingTime = 0;
    private swingTracer: SwingTracer;

    // Orbit around player
    private orbitAngle = 0;
    private idleOrbitAngleOffset = Math.PI / 1.5;
    private side: 1 | -1 = 1; // 1 = one side of mouse, -1 = other side

    private readonly ROT_OFFSET = Math.PI * 0.75; // tweak based on sprite art

    private shadow: Shadow;
    private swingHitSet = new Set<ex.Actor>();

    private comboIndex = 0;
    private comboThreshold = 400;
    private currentAttack!: Attack;

    private thrustDirection = ex.vec(0, 0);
    private thrustDistance!: number; // shorter thrust
    private thrustPauseTime = 150; // ms pause at peak
    private thrusting = false;
    private thrustTracer!: ThrustTracer;

    private combo: Attack[] = [
        {
            type: "slash",
            duration: 250,
            cooldown: 350,
            damageMultiplier: 1,
            startOffset: Math.PI / 1.5,
            endOffset: -Math.PI / 1.5,
        },
        {
            type: "slash",
            duration: 250,
            cooldown: 350,
            damageMultiplier: 1,
            startOffset: -Math.PI / 1.5,
            endOffset: Math.PI / 1.5,
        },
        {
            type: "slash",
            duration: 250,
            cooldown: 350,
            damageMultiplier: 1.2,
            startOffset: -Math.PI / 1.5,
            endOffset: Math.PI / 1.5,
        },
        {
            type: "thrust",
            duration: 220,
            cooldown: 350,
            damageMultiplier: 1.5,
            thrustDistance: 15,
        }
    ];

    private pointerDownHandler = () => {
        this.isHolding = true;
    };

    private pointerUpHandler = () => {
        this.isHolding = false;
    };

    constructor(
        player: Player,
        engine: ex.Engine,
        private resources: GameResources,
        private collisionGroups: any,
        private damage: number,
        private image: ex.ImageSource
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.75, 0.75), // exvec(0.5, 0.7)
            width: resources.Images.greatSword.width * 3.5,
            height: resources.Images.greatSword.height * 3.5,
            z: 4,
        });

        this.player = player;
        this.engine = engine;
        this.offset = ex.vec(this.height * 0.35, 0);
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

        //const outline = new Outline(engine);
        //this.graphics.material = outline.outlineMaterial;
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {

        if (this.isHolding) {
            this.startSwing()
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

        // -------------------------------
        //   SWINGING LOGIC
        // -------------------------------
        if (this.swinging) {
            this.swingProgress += delta;
            const t = Math.min(this.swingProgress / this.swingDuration, 1);

            const eased = t * t * (3 - 2 * t);

            this.orbitAngle =
                this.swingStartAngle +
                (this.swingEndAngle - this.swingStartAngle) * eased;

            // rotate offset
            const rotatedOffset = this.offset.rotate(this.orbitAngle).add(ex.vec(0, 5));

            // ADD BOBBING HERE
            const bobbedOffset = addBobbing(rotatedOffset);

            // position sword with bobbing
            this.pos = this.player.pos.clone().add(bobbedOffset);
            this.rotation = this.orbitAngle + this.ROT_OFFSET;

            // update shadow
            if (this.shadow) {
                this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
            }

            if (t >= 1) {
                this.swinging = false;
                this.orbitAngle = this.swingEndAngle;
            }
            return;
        }
        /*
        if (this.side === 1) {
            this.graphics.flipHorizontal = false;
        } else {
            this.graphics.flipHorizontal = true;
        }
        */

        // -------------------------------
        //   IDLE LOGIC
        // -------------------------------
        this.orbitAngle = mouseAngle + this.idleOrbitAngleOffset;

        const rotatedOffset = this.offset.rotate(this.orbitAngle).add(ex.vec(0, 5));

        // ADD BOBBING HERE TOO
        const bobbedOffset = addBobbing(rotatedOffset);

        this.pos = this.player.pos.clone().add(bobbedOffset);
        this.rotation = this.orbitAngle + this.ROT_OFFSET;

        // shadow update
        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
        }
    }

    private getMouseAngle(): number | null {
        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return null;

        const worldPos = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const dir = worldPos.sub(this.player.pos);
        return dir.toAngle();
    }

    startSwing() {
        const now = performance.now();

        if (this.swinging || this.thrusting) return;
        if (now - this.lastSwingTime < this.swingCooldown) return;

        if (now - this.lastSwingTime > this.comboThreshold) {
            this.comboIndex = 0;
        }

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        this.currentAttack = this.combo[this.comboIndex];

        this.lastSwingTime = now;
        this.swingCooldown = this.currentAttack.cooldown;
        this.swingDuration = this.currentAttack.duration;
        this.swingProgress = 0;
        this.swingHitSet.clear();

        if (this.currentAttack.type === "slash") {
            this.startSlash(mouseAngle);

            this.swingTracer.start(
                this.player,
                this.swingStartAngle,
                this.swingEndAngle,
                this.swingDuration,
                this.height
            );
        } else {
            this.startThrust(mouseAngle);
        }

        this.comboIndex = (this.comboIndex + 1) % this.combo.length;
    }

    private startSlash(mouseAngle: number) {
        this.swinging = true;
        this.swingProgress = 0;

        this.swingStartAngle = mouseAngle + this.currentAttack.startOffset!;
        this.swingEndAngle = mouseAngle + this.currentAttack.endOffset!;

        this.idleOrbitAngleOffset = this.currentAttack.endOffset!;
        this.orbitAngle = this.swingStartAngle;
    }
    private startThrust(mouseAngle: number) {
        this.thrusting = true;
        this.swingProgress = 0;
        this.swingHitSet.clear();

        this.thrustDirection = ex.Vector.fromAngle(mouseAngle);
        this.thrustDistance = this.currentAttack.thrustDistance ?? 55;

        const base = this.player.pos.clone().add(this.thrustDirection.scale(this.height * 0.35));
        const tipStart = base.add(this.thrustDirection.scale(this.height * 0.45));
        const tipEnd = tipStart.add(this.thrustDirection.scale(this.thrustDistance + 35));

        this.thrustTracer.startTrace(tipStart, tipEnd, 140);
    }
    private updateThrust(delta: number) {
        this.swingProgress += delta;

        const forwardTime = 45;
        const pauseTime = this.thrustPauseTime;
        const retractTime = 100;

        const total = forwardTime + pauseTime + retractTime;

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

        const baseOffset = this.thrustDirection.scale(this.height * 0.35);
        const thrustOffset = this.thrustDirection.scale(this.thrustDistance * thrustT);

        this.pos = this.player.pos
            .clone()
            .add(baseOffset)
            .add(thrustOffset)
            .add(ex.vec(0, this.player.bobOffsetY));

        this.rotation = this.thrustDirection.toAngle() + this.ROT_OFFSET;

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
        }

        if (this.swingProgress >= total) {
            this.thrusting = false;
            this.swingProgress = 0;
        }
    }
    /*
    startSwing() {
        const now = performance.now();

        if (now - this.lastSwingTime < this.swingCooldown) return;
        if (this.swinging) return;

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        this.lastSwingTime = now;
        this.swinging = true;
        this.swingProgress = 0;

        // Reset hit cache
        this.swingHitSet.clear();

        this.orbitAngle = mouseAngle + this.side * (Math.PI / 1.5);
        this.swingStartAngle = this.orbitAngle;

        this.swingEndAngle = mouseAngle - this.side * (Math.PI / 1.5);

        this.swingTracer.start(
            this.player,
            this.swingStartAngle,
            this.swingEndAngle,
            this.swingDuration,
            this.height
        );
    }
        */

    onPreCollisionResolve(_self: ex.Collider, other: ex.Collider) {
        const target = other.owner;

        if (!this.swinging && !this.thrusting) return;
        if (!target.tags.has("enemy")) return;
        if (target.isDead) return;

        // Prevent multiple hits on the SAME enemy during the same swing
        if (this.swingHitSet.has(target)) return;

        // First hit this swing → apply damage
        this.swingHitSet.add(target);
        //this.engine.currentScene.camera.shake(8, 8, 60);
        
        target.takeDamage(this.damage * this.combo[this.comboIndex].damageMultiplier);
    }


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

export class SwingTracer extends ex.Actor {
    public active = false;

    private player!: ex.Actor;
    private startAngle = 0;
    private endAngle = 0;
    private progress = 0;
    private duration = 10;
    private radius = 160;
    private visualOffset = ex.vec(0, 5);

    constructor() {
        super({
            name: "swing-tracer",
            pos: ex.vec(0, 0),
            z: 3,
            collisionType: ex.CollisionType.PreventCollision,
        });

        this.graphics.onPostDraw = (ctx) => {
            if (!this.active || !this.player) return;

            const t = Math.min(this.progress / this.duration, 1);
            const eased = t * t * (3 - 2 * t);

            const currentAngle =
                this.startAngle + (this.endAngle - this.startAngle) * eased;

            const trailLength = Math.PI / 2;
            const steps = 50;

            const swingDir = Math.sign(this.endAngle - this.startAngle) || 1;

            const totalArc = Math.abs(this.endAngle - this.startAngle);
            const visibleTrailLength = Math.min(trailLength, totalArc * eased);

            for (let i = 0; i < steps; i++) {
                const percent = i / steps;

                const a =
                    currentAngle -
                    swingDir * visibleTrailLength * percent;

                const alpha = (1 - percent) * 0.45;

                //const inner = this.radius * 0.45;
                //const outer = this.radius * 1.15;

                const inner = this.radius * 0.45;
                const outer = this.radius * 1.35;

                const p1 = this.player.pos.add(ex.Vector.fromAngle(a).scale(inner)).sub(this.pos).add(ex.vec(0, 5));
                const p2 = this.player.pos.add(ex.Vector.fromAngle(a).scale(outer)).sub(this.pos).add(ex.vec(0, 5));

                ctx.save();
                ctx.opacity = alpha;
                ctx.drawLine(p1, p2, ex.Color.White, 4);
                ctx.restore();
            }
        };
    }

    start(player: ex.Actor, startAngle: number, endAngle: number, duration: number, radius: number) {
        this.player = player;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.duration = duration;
        this.radius = radius;
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
}

export class ThrustTracer extends ex.Actor {
    private active = false;
    private start = ex.vec(0, 0);
    private end = ex.vec(0, 0);
    private progress = 0;
    private duration = 500;

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
            const alpha = 1 - t;

            const localStart = this.start.sub(this.pos);
            const localEnd = this.end.sub(this.pos);

            const dir = localEnd.sub(localStart).normalize();
            const perp = ex.vec(-dir.y, dir.x);

            const offset = 20;

            const shiftedStart = localStart.add(
                dir.scale(offset)
            )

            const shfitedEnd = localEnd.add(
                dir.scale(offset)
            )

            const length = shfitedEnd.distance(shiftedStart);
            const steps = 30;

            ctx.save();
            ctx.opacity = alpha;

            for (let i = 0; i < steps; i++) {
                const p = i / steps;

                const center = shiftedStart.add(dir.scale(length * p));

                // wide at base, sharp at tip
                const width = 18 * (1 - p) * alpha;

                const left = center.add(perp.scale(width));
                const right = center.sub(perp.scale(width));

                ctx.drawLine(left, right, ex.Color.White, 3);
            }

            ctx.restore();
        };
    }

    startTrace(start: ex.Vector, end: ex.Vector, duration = 120) {
        this.start = start.clone();
        this.end = end.clone();
        this.duration = duration;
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
}

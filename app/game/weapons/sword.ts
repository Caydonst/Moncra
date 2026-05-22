const ex = await import("excalibur");
import { GameResources } from '../resources';
import { Player } from '../player';
import {Shadow} from "../utils/shadow";
import {Demon} from "../enemies/demon";
import { Outline } from "../utils/swordOutline";
import {DemonBoss} from "../enemies/bosses/DemonBoss";
import { GameScene } from '../scenes/GameScene';

type SwingAttack = {
    duration: number;
    cooldown: number;
    damage: number;
    startOffset: number;
    endOffset: number;
    knockback: number;
};

export class GreatSword extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector; // radius from player center

    // Swing state
    private swinging = false;
    private swingProgress = 0;
    private swingDuration = 300; // ms for full swing

    private swingStartAngle = 0;
    private swingEndAngle = 0;

    private swingCooldown = 400;
    private lastSwingTime = 0;
    private swingTracer: SwingTracer;

    // Orbit around player
    private orbitAngle = 0;
    private side: 1 | -1 = 1; // 1 = one side of mouse, -1 = other side

    private readonly ROT_OFFSET = Math.PI * 0.75; // tweak based on sprite art

    private shadow: Shadow;
    private swingHitSet = new Set<ex.Actor>();

    
    private comboIndex = 0;
    private lastComboTime = 0;
    private comboResetTime = 700;
    private currentAttack!: SwingAttack;

    private combo: SwingAttack[] = [
        {
            duration: 180,
            cooldown: 180,
            damage: 15,
            startOffset: Math.PI / 1.8,
            endOffset: -Math.PI / 1.8,
            knockback: 80,
        },
        {
            duration: 220,
            cooldown: 220,
            damage: 22,
            startOffset: -Math.PI / 1.8,
            endOffset: Math.PI / 1.8,
            knockback: 120,
        },
        {
            duration: 320,
            cooldown: 400,
            damage: 35,
            startOffset: Math.PI / 1.2,
            endOffset: -Math.PI / 1.2,
            knockback: 220,
        },
    ];

    constructor(
        player: Player,
        engine: ex.Engine,
        private resources: GameResources,
        private collisionGroups: any,
        private damage: number,
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.75, 0.75), // exvec(0.5, 0.7)
            width: resources.Images.greatSword.width * 3,
            height: resources.Images.greatSword.height * 3,
            z: 4,
        });

        this.player = player;
        this.engine = engine;
        this.offset = ex.vec(this.height * 0.35, 0);
    }

    onInitialize(engine: ex.Engine) {
        const sprite = this.resources.Images.greatSword.toSprite();
        sprite.width = this.width;
        sprite.height = this.height;

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

        this.graphics.use(sprite);

        this.swingTracer = new SwingTracer();
        engine.currentScene.add(this.swingTracer);

        //const outline = new Outline(engine);
        //this.graphics.material = outline.outlineMaterial;
    }

    private getMouseAngle(): number | null {
        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return null;

        const worldPos = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const dir = worldPos.sub(this.player.pos);
        return dir.toAngle();
    }
    /*
    startSwing() {
        const now = performance.now();

        if (this.swinging) return;
        if (now - this.lastSwingTime < this.swingCooldown) return;

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        if (now - this.lastComboTime > this.comboResetTime) {
            this.comboIndex = 0;
        }

        this.currentAttack = this.combo[this.comboIndex];

        this.lastSwingTime = now;
        this.lastComboTime = now;

        this.swingDuration = this.currentAttack.duration;
        this.swingCooldown = this.currentAttack.cooldown;

        this.swinging = true;
        this.swingProgress = 0;
        this.swingHitSet.clear();

        this.swingStartAngle = mouseAngle + this.currentAttack.startOffset;
        this.swingEndAngle = mouseAngle + this.currentAttack.endOffset;

        const nextAttack = this.combo[this.comboIndex];

        this.orbitAngle = mouseAngle + nextAttack.startOffset;

        this.comboIndex = (this.comboIndex + 1) % this.combo.length;

        this.swingTracer.start(
            this.player,
            this.swingStartAngle,
            this.swingEndAngle,
            this.swingDuration,
            this.height * 0.75
        );
    }
        */
    
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
    

    onPostUpdate(_engine: ex.Engine, delta: number) {
        this.swingTracer?.updateTracer(this.engine, delta);

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

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
                this.side *= -1;
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
        this.orbitAngle = mouseAngle + this.side * (Math.PI / 1.5);

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

    onPreCollisionResolve(_self: ex.Collider, other: ex.Collider) {
        const target = other.owner;

        if (!this.swinging) return;
        if (!target.tags.has("enemy")) return;
        if (target.isDead) return;

        // Prevent multiple hits on the SAME enemy during the same swing
        if (this.swingHitSet.has(target)) return;

        // First hit this swing → apply damage
        this.swingHitSet.add(target);
        //this.engine.currentScene.camera.shake(8, 8, 60);
        target.takeDamage(this.damage);
    }


    addListeners() {
        this.engine.input.pointers.primary.on("down", () => this.startSwing());
    }
    cleanup() {
        this.engine.input.pointers.primary.off("down");
        this.shadow.kill();
        this.swingTracer.kill();
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

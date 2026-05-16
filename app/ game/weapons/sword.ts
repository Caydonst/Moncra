const ex = await import("excalibur");
import { GameResources } from '../resources';
import { Player } from '../player';
import {Shadow} from "../utils/shadow";
import {Demon} from "../enemies/demon";
import { Outline } from "../utils/swordOutline";
import {DemonBoss} from "../enemies/bosses/DemonBoss";

export class GreatSword extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector; // radius from player center

    // Swing state
    private swinging = false;
    private swingProgress = 0;
    private swingDuration = 200; // ms for full swing

    private swingStartAngle = 0;
    private swingEndAngle = 0;

    private swingCooldown = 300;
    private lastSwingTime = 0;

    // Orbit around player
    private orbitAngle = 0;
    private side: 1 | -1 = 1; // 1 = one side of mouse, -1 = other side

    private readonly ROT_OFFSET = Math.PI / 2; // tweak based on sprite art

    private shadow: Shadow;
    private swingHitSet = new Set<ex.Actor>();

    private getEnemies() {
        return this.engine.currentScene.actors.filter(a => a.tags.has("enemy"));
    }

    constructor(
        player: Player,
        engine: ex.Engine,
        private resources: GameResources,
        private collisionGroups: any,
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.7),
            width: resources.Images.greatSword.width * 2.3,
            height: resources.Images.greatSword.height * 2.3,
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

        this.orbitAngle = mouseAngle + this.side * (Math.PI / 1.7);
        this.swingStartAngle = this.orbitAngle;

        this.swingEndAngle = mouseAngle - this.side * (Math.PI / 1.7);
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
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
            const rotatedOffset = this.offset.rotate(this.orbitAngle);

            // ⭐ ADD BOBBING HERE
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

        if (this.side === 1) {
            this.graphics.flipHorizontal = false;
        } else {
            this.graphics.flipHorizontal = true;
        }

        // -------------------------------
        //   IDLE LOGIC
        // -------------------------------
        this.orbitAngle = mouseAngle + this.side * (Math.PI / 1.7);

        const rotatedOffset = this.offset.rotate(this.orbitAngle);

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
        target.takeDamage(20);
    }


    addListeners() {
        this.engine.input.pointers.primary.on("down", () => this.startSwing());
    }
    cleanup() {
        this.engine.input.pointers.primary.off("down");
        this.shadow.kill()
    }
}

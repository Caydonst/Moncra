import * as ex from "excalibur";
import { Player } from "../player";
import { GameResources } from "../resources";
import { Shadow } from "../utils/shadow";

export class SpearAndShield extends ex.Actor {
    private spear: ex.Actor;
    private shield: ex.Actor;

    private isThrusting = false;
    private thrustProgress = 0;
    private thrustDuration = 300;
    private thrustDistance = 50;
    private lastAttackTime = 0;
    private attackCooldown = 400;

    private spearBaseOffset = ex.vec(5, 0);
    private shieldOffset = ex.vec(5, 0);

    private readonly SPEAR_ROT_OFFSET = Math.PI / 4;
    private readonly SHIELD_ROT_OFFSET = 0;
    private shadow!: Shadow;

    private enemiesHitSet = new Set<ex.Actor>();

    constructor(
        private player: Player,
        private engine: ex.Engine,
        private resources: GameResources,
        private spearImage: ex.ImageSource,
        private shieldImage: ex.ImageSource,
        private damage: number,
    ) {
        super({
            name: "spear-and-shield",
            pos: player.pos.clone(),
            collisionType: ex.CollisionType.PreventCollision,
            width: 50,
            height: 50,
            z: 3,
        });

        this.spear = new ex.Actor({
            name: "spear",
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5),
            width: spearImage.width * 2.5,
            height: spearImage.height * 2.5,
            z: 3,
        });

        this.shield = new ex.Actor({
            name: "shield",
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5),
            width: shieldImage.width * 1.5,
            height: shieldImage.height * 1.5,
            collisionType: ex.CollisionType.PreventCollision,
            z: 3,
        });
        this.attack = this.attack.bind(this);
    }

    onInitialize(engine: ex.Engine) {
        const spearSprite = this.spearImage.toSprite();
        spearSprite.width = this.spear.width;
        spearSprite.height = this.spear.height;

        const shieldSprite = this.shieldImage.toSprite();
        shieldSprite.width = this.shield.width;
        shieldSprite.height = this.shield.height;

        this.spear.graphics.use(spearSprite);
        this.shield.graphics.use(shieldSprite);

        engine.currentScene.add(this.spear);
        engine.currentScene.add(this.shield);

        this.addListeners();

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    private getCursorAngle(): number | null {
        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return null;

        const worldPos = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const dir = worldPos.sub(this.player.pos);

        if (dir.size === 0) return null;

        return dir.toAngle();
        }

    private attack() {
        const now = performance.now();

        if (now - this.lastAttackTime < this.attackCooldown) return;
        if (this.isThrusting) return;

        this.enemiesHitSet.clear()

        this.lastAttackTime = now;
        this.isThrusting = true;
        this.thrustProgress = 0;

        console.log("thrust started", this);
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const angle = this.getCursorAngle();
        if (angle === null) return;

        const forward = ex.Vector.fromAngle(angle);
        const right = forward.rotate(Math.PI / 2);

        let thrustOffset = 0;

        if (this.isThrusting) {
            this.thrustProgress += delta;

            const t = Math.min(this.thrustProgress / this.thrustDuration, 1);

            // Out and back thrust curve
            const thrustCurve = Math.sin(t * Math.PI);
            thrustOffset = thrustCurve * this.thrustDistance;

            if (t >= 1) {
            this.isThrusting = false;
            }
        }

        const bobOffset = ex.vec(0, this.player.bobOffsetY ?? 0);

        // Spear sits near player center, tip points toward cursor
        this.spear.pos = this.player.pos
            .add(forward.scale(this.spearBaseOffset.x + thrustOffset))
            .add(bobOffset)
            .add(ex.vec(0, 15));

        this.spear.rotation = (angle + this.SPEAR_ROT_OFFSET);

        // Shield orbits around player toward cursor side
        this.shield.pos = this.player.pos
            .add(forward.scale(this.shieldOffset.x))
            .add(right.scale(this.shieldOffset.y))
            .add(bobOffset)
            .add(ex.vec(0, 10));

        this.shield.rotation = angle + this.SHIELD_ROT_OFFSET;

        this.pos = this.shield.pos;

        this.spear.on("precollision", (evt) => {
            if (!this.isThrusting) return;

            const target = evt.other.owner;

            if (!target.tags.has("enemy")) return;
            if (target.isDead) return;

            if (this.enemiesHitSet.has(target)) return;

            this.enemiesHitSet.add(target);

            this.engine.currentScene.camera.shake(6, 6, 60);

            target.takeDamage(this.damage);
        });

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, 25));
        }
    }

    addListeners() {
        this.engine.input.pointers.primary.on("down", this.attack);
    }

    cleanup() {
        this.engine.input.pointers.primary.off("down", this.attack);
        this.spear.kill();
        this.shield.kill();
        this.shadow.kill();
        this.kill();
    }
}
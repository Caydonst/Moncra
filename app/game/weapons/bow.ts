// gun.ts
import {Ammunition, Weapon} from "@/app/game/items/ItemTypes";

const ex = await import("excalibur");
import {GameResources} from '../resources';
import { Player } from '../player';
import { Bullet } from './bullet';
import { Shadow } from '../utils/shadow';
import {spawnParticles, wallParticles} from "../utils/ParticleHelper";
import {Inventory} from "@/app/game/inventory/inventory";
import {Demon} from "@/app/game/enemies/demon";
import {GameScene} from "@/app/game/scenes/GameScene";
import { dir } from "console";

export class Bow extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector;
    private shadow: Shadow;
    private bowSprite!: ex.Sprite;

    protected bulletCooldown = 300;
    protected lastBulletTime = 0;
    protected isHolding = false;

    private readonly ROT_OFFSET = Math.PI / 4;
    private readonly ARROW_SPAWN_DISTANCE_MULT = 0.5;

    private bowIdleSprite!: ex.Sprite;
    private bowDrawAnim!: ex.Animation;
    private isDrawing = false;
    private animationDuration = 120;

    private pointerDownHandler = () => {
        this.isHolding = true;
    };

    private pointerUpHandler = () => {
        this.isHolding = false;
    };

    constructor(
        player: Player,
        engine: ex.Engine,
        offset: ex.Vector,
        protected resources: GameResources,
        protected collisionGroups: any,
        protected weaponImg: ex.ImageSource,
        private damage: number,
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5), // bottom-center pivot
            width: weaponImg.width * 2.5,
            height: weaponImg.height * 2.5,
            collisionType: ex.CollisionType.PreventCollision,
            z: 4,
        });

        this.player = player;
        this.engine = engine;
        this.offset = offset;
    }

    onInitialize(engine: ex.Engine) {
    this.bowIdleSprite = this.weaponImg.toSprite();
    this.bowIdleSprite.width = this.width;
    this.bowIdleSprite.height = this.height;

    const bowFrames = this.resources.bowSpritesheet.sprites.map(sprite => {
        const s = sprite.clone();        // clone so you can modify safely
        s.scale = ex.vec(2.5, 2.5);
        //s.width = 15 * 2;
        //s.height = 23 * 2;

        return {
            graphic: s,
            duration: this.animationDuration
        };
    });

    this.bowDrawAnim = new ex.Animation({
        frames: bowFrames
    });
    this.graphics.use(this.bowIdleSprite);

    this.shadow = new Shadow(this);
    engine.currentScene.add(this.shadow);
}

    onPostUpdate(engine: ex.Engine, delta: number) {
        const pointer = engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return;

        if (this.isHolding) {
            this.shoot();
        }

        const worldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const direction = worldPos.sub(this.player.pos);

        if (direction.magnitude === 0) return;

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        const distance = this.offset.x + 5;
        const offsetVec = direction.normalize().scale(distance).add(ex.vec(0, 5));
        const bobbedOffset = addBobbing(offsetVec);

        this.pos = this.player.pos.clone().add(bobbedOffset);

        const angle = worldPos.sub(this.pos).toAngle();

        // Bow image points UP, so add 90 degrees
        this.rotation = angle + this.ROT_OFFSET;

        //const isLeft = direction.x < 0;

        // Flip sprite visually only
        //this.bowSprite.flipHorizontal = isLeft;
        //this.bowSprite.flipVertical = false;

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2 + 15));
        }
    }

    protected shoot() {
        const now = performance.now();

        if (this.isDrawing) return;
        if (now - this.lastBulletTime < this.bulletCooldown) return;

        this.lastBulletTime = now;
        this.isDrawing = true;

        this.bowDrawAnim.reset();
        this.graphics.use(this.bowDrawAnim);

        const animationDuration = 4 * this.animationDuration; // frames * frame duration

        setTimeout(() => {
            this.fireArrow();

            this.graphics.use(this.bowIdleSprite);
            this.isDrawing = false;
        }, animationDuration);
    }

    private fireArrow() {
        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return;

        const target = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const direction = target.sub(this.pos).normalize();

        this.engine.currentScene.projectileManager.spawn(
            this.pos.clone(),
            direction.scale(1000),
            this.damage,
        );
    }

    addListeners() {
        const pointer = this.engine.input.pointers.primary;

        pointer.on("down", this.pointerDownHandler);
        pointer.on("up", this.pointerUpHandler);
    }

    cleanup() {
        const pointer = this.engine.input.pointers.primary;

        pointer.off("down", this.pointerDownHandler);
        pointer.off("up", this.pointerUpHandler);

        this.isHolding = false;

        this.shadow?.kill();
        this.kill();
    }
    public attachToScene(scene: ex.Scene) {
        if (!this.shadow || this.shadow.isKilled()) {
            this.shadow = new Shadow(this);
        }
        scene.add(this.shadow);
    }
}

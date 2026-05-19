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

    private readonly ROT_OFFSET = Math.PI / 2;
    private readonly ARROW_SPAWN_DISTANCE_MULT = 0.5;

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
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5), // bottom-center pivot
            width: weaponImg.width * 1.5,
            height: weaponImg.height * 1.5,
            collisionType: ex.CollisionType.PreventCollision,
            z: 3,
        });

        this.player = player;
        this.engine = engine;
        this.offset = offset;
    }

    onInitialize(engine: ex.Engine) {
        this.bowSprite = this.weaponImg.toSprite();
        this.bowSprite.width = this.width;
        this.bowSprite.height = this.height;
        this.graphics.use(this.bowSprite);

        // this.shadow = new Shadow(this);
        // engine.currentScene.add(this.shadow);
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const pointer = engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return;

        if (this.isHolding) {
            this.shoot();
        }

        const worldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const direction = worldPos.sub(this.player.pos);

        if (direction.size === 0) return;

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        const distance = this.offset.x + 5;
        const offsetVec = direction.normalize().scale(distance);
        const bobbedOffset = addBobbing(offsetVec);

        this.pos = this.player.pos.clone().add(bobbedOffset);

        const angle = worldPos.sub(this.pos).toAngle();

        // Bow image points UP, so add 90 degrees
        this.rotation = angle + Math.PI / 2;

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
        if (now - this.lastBulletTime < this.bulletCooldown) return;
        this.lastBulletTime = now;

        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return;

        const target = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);

        const direction = target.sub(this.pos).normalize();

        this.engine.currentScene.projectileManager.spawn(
            this.pos.clone(),
            direction.scale(1000),
            30
        );

        window.dispatchEvent(new Event("inventory-updated"));
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
}

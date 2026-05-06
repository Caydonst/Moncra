// gun.ts
import {Weapon} from "@/app/ game/items/ItemTypes";

const ex = await import("excalibur");
import {GameResources} from '../resources';
import { Player } from '../player';
import { Bullet } from './bullet';
import { Shadow } from '../utils/shadow';
import {spawnParticles, wallParticles} from "../utils/ParticleHelper";
import {Inventory} from "@/app/ game/inventory/inventory";
import {Demon} from "@/app/ game/enemies/demon";
import {GameScene} from "@/app/ game/scenes/GameScene";

export class Gun extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector; // distance from player center
    private shadow: Shadow;
    private bowSprite!: ex.Sprite;

    protected bulletCooldown = this.getBulletCooldown();
    protected lastBulletTime = 0;
    protected isHolding = false;
    protected isReloading = false;

    protected getSpread() {
        return 0;
    }

    protected getBulletSpeed() {
        return 4000;
    }

    protected getReloadTime() {
        return 1700;
    }

    protected getBulletCooldown() {
        return 300;
    }

    protected playShootSound() {

    }

    protected playReloadSound() {

    }

    private pointerDownHandler = () => {
        this.isHolding = true;
    };

    private pointerUpHandler = () => {
        this.isHolding = false;
    };

    private reloadHandler = (evt: ex.KeyEvent) => {
        if (evt.key === ex.Keys.R) {
            this.reload();
        }
    };

    private reloadTimeout?: ReturnType<typeof setTimeout>;

    constructor(player: Player,
                engine: ex.Engine,
                offset: ex.Vector,
                protected resources: GameResources,
                protected collisionGroups: any,
                protected weaponImg: any,
                protected weaponItem: Weapon,
                protected inventory: Inventory,
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5),
            width: weaponImg.width / 2.5,
            height: weaponImg.height / 2.5,
            collisionType: ex.CollisionType.PreventCollision,
            z: 3
        });

        this.player = player;
        this.engine = engine;
        this.offset = offset; // starting offset from center
    }

    onInitialize(engine: ex.Engine) {
        engine.input.keyboard.on("press", this.reloadHandler);

        this.bowSprite = this.weaponImg.toSprite();
        this.bowSprite.width = this.width;
        this.bowSprite.height = this.height;
        this.graphics.use(this.bowSprite);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const pointer = engine.input.pointers.primary;

        if (this.isHolding) {
            this.shoot();
        }

        const worldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);
        const direction = worldPos.sub(this.player.pos);

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        // --- Rotate offset vector to point toward mouse ---
        const angle = direction.toAngle();
        const distance = this.offset.x; // how far from player center
        const offsetVec = direction.normalize().scale(distance);

        const bobbedOffset = addBobbing(offsetVec);

        const isLeft = direction.x < 0;

        this.scale.x = 1;
        this.scale.y = 1;

        this.rotation = angle + (isLeft ? -Math.PI / 2 : Math.PI / 2);

        // flip only the image
        this.bowSprite.flipVertical = isLeft;

        // --- Set bow position ---
        this.pos = this.player.pos.clone().add(bobbedOffset);

        if (this.shadow) {
            // Position slightly under demon feet (same offset you used before)
            this.shadow.pos = this.pos.add(ex.vec(0, this.height/2 + 15));
        }
    }
    protected shoot() {
        const now = performance.now();
        if (now - this.lastBulletTime < this.bulletCooldown) return;
        this.lastBulletTime = now;

        if (this.isReloading) return;

        const mag = this.weaponItem.magazine;
        if (!mag || mag.amount <= 0) {
            console.log("no ammo");
            this.resources.sounds.gunEmpty?.play(0.1);
            return;
        }

        const pointer = this.engine.input.pointers.primary;
        const target = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);

        let direction = target.sub(this.player.pos).normalize();

        const spread = this.getSpread();
        const randomAngle = (Math.random() - 0.5) * spread;
        direction = direction.rotate(randomAngle).normalize();

        const spawnPos = this.pos.add(direction.scale(this.height / 2));

        spawnParticles(this.engine.currentScene, spawnPos, "enemy");
        /*
        const scene = this.engine.currentScene as GameScene;
        scene.particles.emitBurst(spawnPos, {
            count: 200,
            color: ex.Color.fromHex("#ffd500"),
            minSpeed: 80,
            maxSpeed: 140,
            minLife: 500,
            maxLife: 800,
            size: 3,
        });

         */

        this.engine.currentScene.camera.shake(4, 4, 60);

        const bullet = new Bullet(
            this.height,
            spawnPos.clone(),
            direction.scale(this.getBulletSpeed()),
            this.resources,
            this.collisionGroups,
            this.weaponItem.stats.damage
        );

        this.engine.currentScene.add(bullet);

        this.playShootSound();

        mag.amount--;
        window.dispatchEvent(new Event("inventory-updated"));
    }
    protected reload() {
        if (this.isReloading) return;

        const currentMag = this.weaponItem.magazine;

        const newMag = this.inventory.misc.find(slot =>
            slot &&
            "amount" in slot &&
            slot.type === this.weaponItem.type &&
            slot.amount > 0 &&
            slot.id !== currentMag?.id
        );

        if (!newMag) {
            console.log("No mag found");
            return;
        }

        this.isReloading = true;
        this.playReloadSound();

        this.reloadTimeout = setTimeout(() => {
            this.weaponItem.magazine = newMag;
            this.isReloading = false;

            window.dispatchEvent(new Event("inventory-updated"));
            console.log("Swapped mag");
        }, this.getReloadTime());
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
        this.engine.input.keyboard.off("press", this.reloadHandler);

        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }

        this.isHolding = false;
        this.isReloading = false;

        this.shadow?.kill();
        this.kill();
    }

    private spawnGroundFlash(pos: ex.Vector, direction: ex.Vector) {
        const groundPos = pos.add(ex.vec(-this.width, this.height / 2 + 18));

        const flash = new ex.Actor({
            pos: groundPos,
            anchor: ex.vec(0.5, 0.5),
            width: 70,
            height: 28,
            collisionType: ex.CollisionType.PreventCollision,
            z: 1.5,
            opacity: 0.15,
        });

        const glow = new ex.Circle({
            radius: 28,
            color: ex.Color.fromHex("#ffd500"),
        });

        flash.graphics.use(glow);

        flash.scale = ex.vec(1.4, 0.45);
        flash.rotation = direction.toAngle();

        this.engine.currentScene.add(flash);

        flash.actions
            .scaleTo(ex.vec(2.2, 0.7), ex.vec(35, 35))
            .fade(0, 80)
            .callMethod(() => flash.kill());
    }
}

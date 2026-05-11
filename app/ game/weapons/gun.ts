// gun.ts
import {Ammunition, Weapon} from "@/app/ game/items/ItemTypes";

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

    protected getDamage() {
        return 10;
    }

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
            width: weaponImg.width * 1.5,
            height: weaponImg.height * 1.5,
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

        //this.shadow = new Shadow(this);
        //engine.currentScene.add(this.shadow);
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const pointer = engine.input.pointers.primary;

        if (this.isHolding) {
            this.shoot();
        }

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        const worldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);

        const playerToMouse = worldPos.sub(this.player.pos);
        const offsetAngle = playerToMouse.toAngle();
        const isLeft = playerToMouse.x < 0;

        const localOffset = ex.vec(
            this.offset.x,
            isLeft ? -this.offset.y : this.offset.y
        );

        const rotatedOffset = localOffset.rotate(offsetAngle);
        const bobbedOffset = addBobbing(rotatedOffset);

        this.pos = this.player.pos.clone().add(bobbedOffset);

        // now rotate gun toward cursor from actual gun position
        const gunToMouse = worldPos.sub(this.pos);
        this.rotation = gunToMouse.toAngle();

        this.bowSprite.flipVertical = isLeft;

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
            this.resources.sounds.gunEmpty?.play(0.05);
            return;
        }

        const pointer = this.engine.input.pointers.primary;
        const target = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);

        const gunForward = ex.Vector.fromAngle(this.rotation);
        const spawnPos = this.pos.add(gunForward.scale(this.width / 2));

        let aimDirection = target.sub(spawnPos).normalize();

        const spread = this.getSpread();
        const randomAngle = (Math.random() - 0.5) * spread;
        aimDirection = aimDirection.rotate(randomAngle).normalize();

        (this.engine.currentScene as GameScene).particleManager.emit(
            spawnPos,
            12,
            ex.Color.fromHex("#ffd000"),
            60,
            100,
            80,
            3,
            0,
        );

        //this.engine.currentScene.camera.shake(4, 4, 60);

        const bullet = new Bullet(
            this.engine,
            0,
            spawnPos.clone(),
            aimDirection.scale(this.getBulletSpeed()),
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

        if (currentMag?.amount !== 0) return;

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

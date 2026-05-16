import * as ex from "excalibur";
import { Player } from "../player";
import { GameResources } from "../resources";
import { Weapon } from "../items/ItemTypes";
import { GameScene } from "../scenes/GameScene";
import { Bullet } from "../weapons/bullet";
import { EnemyPlayer } from "./enemyPlayer";

export class EnemyGun extends ex.Actor {
    private player: EnemyPlayer;
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
        return 1000;
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

    private reloadTimeout?: ReturnType<typeof setTimeout>;

    constructor(player: EnemyPlayer,
                engine: ex.Engine,
                offset: ex.Vector,
                protected resources: GameResources,
                protected collisionGroups: any,
                protected weaponImg: any,
                private target: Player,
    ) {
        super({
            pos: player.pos.clone(),
            anchor: ex.vec(0.5, 0.5),
            width: weaponImg.width * 1.2,
            height: weaponImg.height * 1.2,
            collisionType: ex.CollisionType.PreventCollision,
            z: 3
        });

        this.engine = engine;
        this.offset = offset; // starting offset from center
        this.player = player;
    }

    onInitialize(engine: ex.Engine) {

        this.bowSprite = this.weaponImg.toSprite();
        this.bowSprite.width = this.width;
        this.bowSprite.height = this.height;
        this.graphics.use(this.bowSprite);

        //this.shadow = new Shadow(this);
        //engine.currentScene.add(this.shadow);
    }

    onPostUpdate(engine: ex.Engine, delta: number) {

        this.aim();
        

        if (this.shadow) {
            // Position slightly under demon feet (same offset you used before)
            this.shadow.pos = this.pos.add(ex.vec(0, this.height/2 + 15));
        }
    }
    private aim() {

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        // Aim target
        const targetPos = this.target.pos;

        // Direction from enemy player -> target player
        const playerToTarget = targetPos.sub(this.player.pos);

        const offsetAngle = playerToTarget.toAngle();
        const isLeft = playerToTarget.x < 0;

        const localOffset = ex.vec(
            this.offset.x,
            isLeft ? -this.offset.y : this.offset.y
        );

        const rotatedOffset = localOffset.rotate(offsetAngle);
        const bobbedOffset = addBobbing(rotatedOffset);

        this.pos = this.player.pos.clone().add(bobbedOffset);

        // Rotate gun toward target
        const gunToTarget = targetPos.sub(this.pos);
        this.rotation = gunToTarget.toAngle();

        this.bowSprite.flipVertical = isLeft;
    
    }
    public shoot() {
        const now = performance.now();
        if (now - this.lastBulletTime < this.bulletCooldown) return;
        this.lastBulletTime = now;

        const target = this.target.pos.clone();

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

        this.engine.currentScene.projectileManager.spawn(
            spawnPos,
            aimDirection.scale(this.getBulletSpeed()),
            20
        );

        this.playShootSound();

    }

    cleanup() {

        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }

        this.isHolding = false;
        this.isReloading = false;

        this.shadow?.kill();
        this.kill();
    }
}
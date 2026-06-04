import {GameResources} from "@/app/game/resources";

const ex = await import("excalibur");
import { Player } from '../player/player'
import {collidesWithWall8} from '../utils/checkCollisions'
import {Shadow} from "../utils/shadow";
import {HPBar} from "../utils/hpbar";
import { Coin } from "../coin";
import {spawnParticles, wallParticles} from "../utils/ParticleHelper";
import {DemonBoss} from "@/app/game/enemies/bosses/DemonBoss";

export class Demon extends ex.Actor {
    private speed = 220; // pixels per second
    private target: ex.Actor; // the player
    private worldWidth: number;
    private worldHeight: number;
    private hp: number;
    private maxHp: number;
    private walkAnim: ex.Animation;
    private deadAnim: ex.Animation;
    private miscAnim: ex.Animation;
    private engine: ex.Engine;
    private displayedHp: number;
    public isDead: boolean = false;
    private shadow: Shadow;
    private hpBar: HPBar;
    private playedDeath = false;
    private playedMisc = false;
    public scene: ex.Scene;
    private knockbackVel: ex.Vector = ex.vec(0, 0);
    private knockbackTimer: number = 0;
    private hurtSprite!: ex.Sprite;
    private damage: number = 15;
    private touchingPlayer: Player | null = null;
    private damageCooldown = 1000; // ms
    private lastDamageTime = 0;
    private isAFK = true;

    constructor(engine: ex.Engine, pos: ex.Vector, target: ex.Actor, hp: number, maxHp: number, private resources: GameResources, private collisionGroups: any) {
        super({
            name: "enemy",
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            width: 14 * 2.5,
            height: 21 * 2.5,
            color: ex.Color.Red,
            z: 2,
            collisionType: ex.CollisionType.Active,
            collisionGroup: collisionGroups.enemyGroup,
        });
        this.tags.add("enemy");
        this.target = target;
        this.hp = hp;
        this.maxHp = maxHp;
        this.engine = engine;
        this.scene = engine.currentScene;
    }

    onInitialize(engine: ex.Engine) {

        this.displayedHp = this.hp;
        this.body.collisionType = ex.CollisionType.Active;

        const walkFrames = Object.keys(this.resources.DemonImages.walk).map(key => {
            const sprite = this.resources.DemonImages.walk[key].toSprite();
            sprite.scale = ex.vec(2.5, 2.5);
            return sprite;
        });
        const deadFrames = Object.keys(this.resources.DemonImages.dead).map(key => {
            const sprite = this.resources.DemonImages.dead[key].toSprite();
            sprite.scale = ex.vec(2.5, 2.5);
            return sprite;
        });
        const miscFrames = Object.keys(this.resources.MiscImages).map(key => {
            const sprite = this.resources.MiscImages[key].toSprite();
            sprite.scale = ex.vec(2, 2);
            sprite.origin = ex.vec(0.5, 1);
            return sprite;
        });
        this.walkAnim = new ex.Animation({
            frames: walkFrames.map(sprite => ({
                graphic: sprite,
                duration: 150
            }))
        });
        this.deadAnim = new ex.Animation({
            frames: deadFrames.map(sprite => ({
                graphic: sprite,
                duration: 300,
                loop: false,
            })),
            strategy: ex.AnimationStrategy.End
        });
        this.miscAnim = new ex.Animation({
            frames: miscFrames.map(sprite => ({
                graphic: sprite,
                duration: 80,
                loop: false,
            })),
            strategy: ex.AnimationStrategy.End,
        })

        this.graphics.add("walk", this.walkAnim);
        this.graphics.add("dead", this.deadAnim);
        this.graphics.add("misc", this.miscAnim);
        this.graphics.use("walk");

        this.hurtSprite = this.resources.DemonImages.hurt.demonHurt.toSprite();
        this.hurtSprite.width *= 2.5;
        this.hurtSprite.height *= 2.5;

        this.hpBar = new HPBar(this, this.width, 5, this.maxHp, "enemy");
        engine.currentScene.add(this.hpBar);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

    }

    onPostUpdate(_engine: ex.Engine, delta: number) {

        if (this.isDead && !this.playedDeath) {
            this.graphics.use("dead");
            this.playedDeath = true;
            return;
        }

        // When the dead animation finishes, switch to misc once
        if (this.playedDeath && !this.playedMisc && this.deadAnim.done) {
            this.graphics.offset = ex.vec(0, -30);
            this.graphics.use("misc");
            this.playedMisc = true;
            //this.spawnCoins(3);
            return;
        }

        // When misc finishes, clean up once
        if (this.miscAnim.done) {
            this.destroyEnemy();
            return;
        }

        if (this.isDead) return;

        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;

            // Apply knockback velocity
            this.vel = this.knockbackVel;

            // Gradually reduce knockback (friction)
            this.knockbackVel = this.knockbackVel.scale(0.85);

            return; // skip normal movement until knockback ends
        }

        const direction = this.target.pos.sub(this.pos);

        if (direction.magnitude <= 500) {
            this.isAFK = false;

        }

        if (!this.isAFK) {
            const dir = direction.normalize();
            this.vel = dir.scale(this.speed);
        }

        const flip = this.vel.x > 0;
        this.walkAnim.flipHorizontal = flip;
        this.deadAnim.flipHorizontal = flip;

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
        }

        if (!this.touchingPlayer) return;

        const now = performance.now();

        if (now - this.lastDamageTime >= this.damageCooldown) {
            this.damagePlayer();
        }
    }
    takeDamage(amount: number) {

        console.log(amount);
        if (this.isDead) return;

        this.hp -= amount;
        this.hp = Math.max(this.hp);
        this.hpBar.setHP(this.hp);

        if (this.hp <= 0) {
            this.killEnemy();
            return;
        }

        this.isAFK = false;

        const knockDir = this.pos.sub(this.target.pos).normalize();

        const KB_STRENGTH = 250;
        this.knockbackVel = knockDir.scale(KB_STRENGTH);
        this.knockbackTimer = 100;

        if (this.vel.x > 0) {
            this.hurtSprite.flipHorizontal = true;
        }

        this.graphics.use(this.hurtSprite);

        // Revert back to walk animation after 200ms
        const revertTimer = new ex.Timer({
            interval: 150,
            repeats: false,
            action: () => {
                if (!this.isDead) {
                    this.graphics.use("walk");
                }
            }
        });
        this.engine.currentScene.add(revertTimer);
        revertTimer.start();

    }
    killEnemy() {
        if (this.isDead) return;

        this.vel = ex.vec(0, 0);
        this.collider.clear();
        this.hpBar?.kill();

        this.isDead = true;
    }
    destroyEnemy() {
        this.hpBar?.kill();
        this.shadow?.kill();
        this.kill();
    }
    onCollisionStart(_self: ex.Collider, other: ex.Collider) {
        if (other.owner instanceof Player) {
            this.touchingPlayer = other.owner;

            // optional: damage immediately on first touch
            this.damagePlayer();
        }
    }
    onCollisionEnd(_self: ex.Collider, other: ex.Collider) {
        if (other.owner instanceof Player) {
            this.touchingPlayer = null;
        }
    }
    private damagePlayer() {
        if (!this.touchingPlayer) return;

        this.touchingPlayer.takeDamage(this.damage);
        this.lastDamageTime = performance.now();
    }
    /*
    spawnCoins(count: number = 2) {
        for (let i = 0; i < count; i++) {
            const coin = new Coin(this.pos.clone());
            this.engine.currentScene.add(coin);
        }
    }

     */
}
/*if (this.deadAnim.done) {
        this.graphics.use("misc");
    }
    if (this.miscAnim.done) {
        this.kill();
    }

    const lerpSpeed = 0.01;
    this.displayedHp += (this.hp - this.displayedHp) * lerpSpeed;

    if (this.isDead) return;

    this.repathTimer -= delta;
    if (this.repathTimer <= 0 || this.path.length === 0) {
        this.path = findPath(
            this.pos,
            this.target.pos,
            90 // TILE_SIZE
        );
        this.pathIndex = 0;
        this.repathTimer = 400; // recalc path every 0.4s
    }

    if (this.path.length > 0 && this.pathIndex < this.path.length) {
        const next = this.path[this.pathIndex];
        const direction = next.sub(this.pos);

        // close enough to next tile? advance
        if (direction.magnitude < 100) {
            this.pathIndex++;
            return;
        }

        // move along path
        this.vel = direction.normalize().scale(this.speed);

        // flip based on motion
        const flip = this.vel.x > 0;
        this.walkAnim.flipHorizontal = flip;
        this.deadAnim.flipHorizontal = flip;
    }/*
*/



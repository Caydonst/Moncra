const ex = await import("excalibur");
import {GameResources} from "../../resources";
import {Shadow} from "../../utils/shadow";
import {HPBar} from "../../utils/hpbar";
import { Coin } from "../../coin";
import {spawnParticles, wallParticles} from "../../utils/ParticleHelper";
import {Player} from "../../player/player"

export class DemonBoss extends ex.Actor {
    private speed: number; // pixels per second
    private target: ex.Actor; // the player
    private worldWidth: number;
    private worldHeight: number;
    private hp: number;
    private maxHp: number;
    private idleAnim: ex.Animation;
    private walkAnim: ex.Animation;
    private deadAnim: ex.Animation;
    private miscAnim: ex.Animation;
    private engine: ex.Engine;
    private displayedHp: number;
    public isDead: boolean;
    private step: ex.Vector
    private path: ex.Vector[] = [];
    private pathIndex = 0;
    private repathTimer = 0;
    private shadow: Shadow;
    private hpBar: HPBar;
    private playedDeath = false;
    private playedMisc = false;
    public scene: ex.Scene;
    private knockbackVel: ex.Vector = ex.vec(0, 0);
    private knockbackTimer: number = 0;
    private shookThisFrame = false;
    private specialAttackPhase: boolean = true;
    private specialAttackNum: number = 0
    private totalSpecialAttackNum: number = 5
    private attackCooldown: number = 150
    private lastAttackTime: number = 0
    private attacking: boolean = false;
    private hurtSprite!: ex.Sprite;
    private hurtTimer?: ex.Timer;

    constructor(engine: ex.Engine, pos: ex.Vector, worldWidth: number, worldHeight: number, target: ex.Actor, speed: number = 100, hp: number, maxHp: number, private resources: GameResources, private collisionGroups: any) {
        super({
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            width: 26 * 3.5,
            height: 31 * 3.5,
            color: ex.Color.Red,
            z: 2,
            collisionGroup: collisionGroups.enemyGroup,
        });
        this.tags.add("enemy");
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.speed = speed;
        this.target = target;
        this.hp = hp;
        this.maxHp = maxHp;
        this.engine = engine;
    }

    onInitialize(engine: ex.Engine) {
        this.scene = engine.currentScene;

        this.displayedHp = this.hp;
        this.body.collisionType = ex.CollisionType.Active;

        this.hurtSprite = this.resources.Images.demonBossHurt.toSprite();
        this.hurtSprite.width = this.width;
        this.hurtSprite.height = this.height;

        const idleFrames = this.resources.demonBossIdleSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.width = this.width;                    // scale X
            s.height = this.height;                   // scale Y

            return {
                graphic: s,
                duration: 300
            };
        });
        this.idleAnim = new ex.Animation({
            frames: idleFrames
        });
        const walkFrames = this.resources.demonBossWalkSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.width = this.width;                    // scale X
            s.height = this.height;                   // scale Y

            return {
                graphic: s,
                duration: 200
            };
        });
        this.walkAnim = new ex.Animation({
            frames: walkFrames
        });

        const deadFrames = Object.keys(this.resources.DemonImages.dead).map(key => {
            const sprite = this.resources.DemonImages.dead[key].toSprite();
            sprite.scale = ex.vec(2.5, 2.5);
            return sprite;
        });
        const miscFrames = Object.keys(this.resources.MiscImages).map(key => {
            const sprite = this.resources.MiscImages[key].toSprite();
            sprite.scale = ex.vec(2.5, 2.5);
            return sprite;
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
                origin: ex.vec(0, -100)
            })),
            strategy: ex.AnimationStrategy.End
        })

        this.graphics.add("idle", this.idleAnim);
        this.graphics.add("walk", this.walkAnim);
        this.graphics.add("dead", this.deadAnim);
        this.graphics.add("misc", this.miscAnim);

        this.graphics.use("idle");

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
            this.graphics.use("misc");
            this.playedMisc = true;
            return;
        }

        // When misc finishes, clean up once
        if (this.playedMisc && this.miscAnim.done) {
            this.cleanup()
            return;
        }

        if (this.isDead) return;

        const direction = this.target.pos.sub(this.pos);

        if (direction.magnitude < 500) {
            this.attacking = true;
        }

        if (this.idleAnim.currentFrameIndex !== 3) {
            this.shookThisFrame = false;
        }

        if (this.attacking) {
            if (this.specialAttackPhase) {
                if (this.idleAnim.currentFrameIndex === 3 && !this.shookThisFrame) {
                    this.engine.currentScene.camera.shake(10, 10, 120);
                    if (this.specialAttackNum < this.totalSpecialAttackNum) {
                        this.specialAttack(_engine.currentScene, this.pos.clone())
                        this.specialAttackNum++
                        console.log("Special attack")
                        if (this.specialAttackNum >= this.totalSpecialAttackNum) {
                            this.specialAttackPhase = false;
                        }
                    }
                    this.shookThisFrame = true;
                }
            } else {
                this.graphics.use("walk");
                const dir = direction.normalize();
                this.vel = dir.scale(this.speed);
                if (this.hurtTimer?.complete) {
                    this.graphics.use("walk");
                }
                this.attack(_engine.currentScene, this.pos.clone());
            }
        }
        const flip = this.vel.x < 0;
        this.idleAnim.flipHorizontal = flip;
        this.walkAnim.flipHorizontal = flip;
        //this.deadAnim.flipHorizontal = flip;

        if (this.shadow) {
            // Position slightly under demon feet (same offset you used before)
            this.shadow.pos = this.pos.add(ex.vec(0, 55));
        }

        if (this.deadAnim.done) {
            this.graphics.use("misc");
        }
        if (this.miscAnim.done) {
            this.kill();
        }
    }
    specialAttack(scene: ex.Scene, origin: ex.Vector) {
        const bulletCount = 20;
        const bulletSpeed = 500;
        const angleStep = (Math.PI * 2) / bulletCount;

        for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep;
            const dir = ex.vec(Math.cos(angle), Math.sin(angle));

            scene.add(new BossBullet(
                origin.clone(),
                dir,
                bulletSpeed,
                this.collisionGroups
            ));
        }
    }
    attack(scene: ex.Scene, origin: ex.Vector) {
        const now = performance.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        const player = scene.player;
        if (!player) return;

        const dir = player.pos.sub(origin).normalize();

        scene.add(new BossBullet(
            origin.clone(),
            dir,
            500,
            this.collisionGroups
        ));
    }
    takeDamage(amount: number) {
        if (this.isDead) return;

        this.hp = Math.max(0, this.hp - amount);
        this.hpBar.setHP(this.hp);

        if (this.hp <= 0) {
            this.handleDeath();
            return;
        }

        this.hurtSprite.flipHorizontal = this.vel.x > 0;
        this.graphics.use(this.hurtSprite);

        this.hurtTimer = new ex.Timer({
            interval: 150,
            repeats: false,
            action: () => {
                if (!this.isDead) {
                    this.graphics.use(this.specialAttackPhase ? "idle" : "walk");
                }
            }
        });

        this.engine.currentScene.add(this.hurtTimer);
        this.hurtTimer.start();
    }
    handleDeath() {
        if (this.isDead) return;

        this.isDead = true;
        this.vel = ex.Vector.Zero;
        this.body.collisionType = ex.CollisionType.PreventCollision;
        this.collider.clear();
        this.hpBar?.kill();

        this.engine.currentScene.emit("enemy-died", this);
    }
    private cleanup() {
        this.shadow?.kill();
        this.kill();
    }
}

export class BossBullet extends ex.Actor {
    private lifetime = 3000; // ms
    private age = 0;

    constructor(
        pos: ex.Vector,
        direction: ex.Vector,
        speed: number,
        private collisionGroups: any
    ) {
        super({
            pos,
            radius: 5,
            color: ex.Color.Orange,
            z: 2,
            collisionType: ex.CollisionType.Passive,
            collisionGroup: collisionGroups.enemyProjectileGroup,
        });

        this.vel = direction.normalize().scale(speed);
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        this.age += delta;

        if (this.age >= this.lifetime) {
            this.kill();
        }
    }

    onCollisionStart(other: ex.Collider) {
        if (other.owner instanceof Player) {
            other.owner.takeDamage(20);
            this.kill();
            return;
        }

        spawnParticles(this.scene, this.pos, "muzzle", {
            count: 6,
            colors: "#5c5c5c",
            minSpeed: 20,
            maxSpeed: 20,
            minLife: 200,
            maxLife: 240,
            size: 3,
            z: 5,
        });

        //wallParticles(this.scene, this.pos, "wall");
        this.kill();
    }
}





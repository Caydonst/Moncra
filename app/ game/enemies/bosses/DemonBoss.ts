const ex = await import("excalibur");
import {GameResources} from "../../resources";
import {Shadow} from "../../utils/shadow";
import {HPBar} from "../../utils/hpbar";
import { Coin } from "../../coin";
import {spawnParticles, wallParticles} from "../../utils/ParticleHelper";
import {Player} from "../../player"

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
        /*
        const deadFrames = Object.keys(DemonImages.dead).map(key => {
            const sprite = DemonImages.dead[key].toSprite();
            sprite.width *= 2.5;
            sprite.height *= 2.5;
            return sprite;
        });
        const miscFrames = Object.keys(MiscImages).map(key => {
            const sprite = MiscImages[key].toSprite();
            sprite.width *= 2.5;
            sprite.height *= 2.5;
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

        this.graphics.add("walk", this.walkAnim);
        this.graphics.add("dead", this.deadAnim);
        this.graphics.add("misc", this.miscAnim);
        this.graphics.use("walk");
         */

        this.graphics.add("idle", this.idleAnim);
        this.graphics.add("walk", this.walkAnim);
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
            this.spawnCoins(3);
            return;
        }

        // When misc finishes, clean up once
        if (this.playedMisc && this.miscAnim.done) {
            this.kill();
            this.hpBar.kill();
            this.shadow.kill();
            return;
        }

        if (this.isDead) return;

        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;

            // Apply knockback velocity
            this.vel = this.knockbackVel;

            // Gradually reduce knockback (friction)
            this.knockbackVel = this.knockbackVel.scale(0.5);

            return; // skip normal movement until knockback ends
        }

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
                const dir = direction.normalize();
                this.vel = dir.scale(this.speed);
                this.graphics.use("walk");
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
    }
    specialAttack(scene: ex.Scene, origin: ex.Vector) {
        const bulletCount = 20;
        const bulletSpeed = 500;
        const angleStep = (Math.PI * 2) / bulletCount;

        for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep;

            const dir = ex.vec(Math.cos(angle), Math.sin(angle));

            const bullet = new Bullet(origin.clone(), dir, bulletSpeed, scene, this.collisionGroups);

            scene.add(bullet);
        }
    }
    attack(scene: ex.Scene, origin: ex.Vector) {
        const now = performance.now();

        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        const bulletSpeed = 500;

        // Get the player
        const player = scene.player;
        if (!player) return;

        // Calculate direction from enemy → player
        const dir = player.pos.sub(origin).normalize();

        // Create bullet
        const bullet = new Bullet(origin.clone(), dir, bulletSpeed, scene, this.collisionGroups);

        scene.add(bullet);
    }
    takeDamage(amount: number) {

        const knockDir = this.pos.sub(this.target.pos).normalize();

        this.hp -= amount;
        this.hpBar.setHP(this.hp);

        const KB_STRENGTH = 500;
        this.knockbackVel = knockDir.scale(KB_STRENGTH);
        this.knockbackTimer = 150;

        this.engine.currentScene.camera.shake(6, 6, 80);

        if (this.hp <= 0) {
            this.handleDeath();
            return;
        }

        const hurtSprite = this.resources.Images.demonBossHurt.toSprite();
        hurtSprite.width *= 3.5;
        hurtSprite.height *= 3.5;
        if (this.vel.x > 0) {
            hurtSprite.flipHorizontal = true;
        }
        this.graphics.use(hurtSprite);

        // Revert back to walk animation after 200ms
        if (this.specialAttackPhase) {
            const revertTimer = new ex.Timer({
                interval: 200,
                repeats: false,
                action: () => {
                    this.graphics.use("idle"); // revert back to normal animation
                }
            });
            this.engine.currentScene.add(revertTimer);
            revertTimer.start();
        } else {
            const revertTimer = new ex.Timer({
                interval: 200,
                repeats: false,
                action: () => {
                    this.graphics.use("walk"); // revert back to normal animation
                }
            });
            this.engine.currentScene.add(revertTimer);
            revertTimer.start();
        }


    }
    handleDeath() {
        this.kill();
        this.shadow.kill();
        this.hpBar.kill();
        /*
        this.body.collisionType = ex.CollisionType.Passive;
        this.graphics.use("dead");
        this.vel = ex.vec(0, 0);
        this.isDead = true;
        this.engine.currentScene.emit('enemy-died', this);

         */
    }
    spawnCoins(count: number = 2) {
        for (let i = 0; i < count; i++) {
            const coin = new Coin(this.pos.clone());
            this.engine.currentScene.add(coin);
        }
    }
}

export class Bullet extends ex.Actor {
    private scene: ex.Scene;
    private shadow: Shadow;

    constructor(pos: ex.Vector, direction: ex.Vector, speed: number, scene: ex.Scene, private collisionGroups: any) {
        super({
            pos,
            radius: 5,
            color: ex.Color.Orange,
            z: 2,
            collisionGroup: collisionGroups.enemyProjectileGroup,
        });
        this.scene = scene;
        this.vel = direction.normalize().scale(speed);
    }

    onInitialize(engine: ex.Engine) {
        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }
    onPostUpdate() {
        if (this.shadow) {
            // Position slightly under demon feet (same offset you used before)
            this.shadow.pos = this.pos.add(ex.vec(0, 15));
        }
    }
    onCollisionStart(_self: ex.Collider, other: ex.Collider) {
        if (other.owner instanceof Player) {
            other.owner.takeDamage(20);
            this.kill()
            this.shadow.kill();
        } else {
            wallParticles(this.scene, this.pos, "wall");
            this.kill()
            this.shadow.kill();
        }
    }
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



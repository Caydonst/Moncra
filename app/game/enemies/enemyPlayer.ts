import * as ex from "excalibur";
import {Engine, Resource} from "excalibur";
import {GameResources} from "@/app/ game/resources";
import {collidesWithWall8} from '../utils/checkCollisions'
import {Shadow} from "../utils/shadow";
import {spawnParticles} from "@/app/ game/utils/ParticleHelper";
import { GameScene } from "../scenes/GameScene";
import { Weapon } from "../items/ItemTypes";
import { Rifle } from "../weapons/rifle";
import { Player } from "../player";
import { Pistol } from "../weapons/pistol";
import { SMG } from "../weapons/smg";
import { EnemyGun } from "./enemyGun";
import { HPBar } from "../utils/hpbar";

export class EnemyPlayer extends ex.Actor {
    private speed: number = 300;
    public maxHp: number = 100;
    public hp: number = this.maxHp;
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private walkAnim: ex.Animation;
    private idleAnim: ex.Animation;
    private move = ex.vec(0, 0);
    private moveCooldown = 1000; // ms
    private moveTimer = 0;
    private shootCooldown = 1000;
    private shootTimer = 0;
    private speed = 150;
    public bobOffsetY = 0;
    private shadow: Shadow;
    public isDead: boolean = false;
    private weapon: EnemyGun;
    private hpBar: HPBar;
    private particleTimer!: ex.Timer;

    constructor(pos: ex.Vector, worldWidth: number, worldHeight: number, hp: number, maxHp: number, private player: Player, private resources: GameResources, private collisionGroups: any) {
        super({
            name: "Enemy",
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            width: 15 * 2,    // set desired width
            height: 19 * 2,   // set desired height
            color: ex.Color.Yellow,  // optional, for debugging
            collisionType: ex.CollisionType.Active,
            z: 3,
            collisionGroup: collisionGroups.enemyGroup,
        });
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    onInitialize(engine: Engine) {
        const walkFrames = this.resources.characterWalkSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.scale = ex.vec(2, 2);

            return {
                graphic: s,
                duration: 120
            };
        });
        const idleFrames = this.resources.characterIdleSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.scale = ex.vec(2, 2);

            return {
                graphic: s,
                duration: 180
            };
        });

        this.walkAnim = new ex.Animation({
            frames: walkFrames
        });
        this.idleAnim = new ex.Animation({
            frames: idleFrames
        });

        this.graphics.add("idle", this.idleAnim);
        this.graphics.add("walk", this.walkAnim);
        this.graphics.use("idle");

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

        const random = new ex.Random(); // or pass a seed if you want reproducible randomness

        this.particleTimer = new ex.Timer({
            interval: 0,             // base interval (ms)
            random,                    // Excalibur Random instance
            randomRange: [20, 200],    // add a random float between 50 and 200 ms
            repeats: true,
            action: () => {
                if (this.isDead || this.isKilled()) return;

                if (this.move.magnitude > 0) {
                    (engine.currentScene as GameScene).particleManager.emit(
                        this.pos.add(ex.vec(0, 18)),
                        1,
                        ex.Color.fromHex("#5c5c5c"),
                        0,
                        0,
                        400,
                        3,
                        3,
                    );
                }
            },
        });

        const weapon = new EnemyGun(
                            this,
                            engine, 
                            ex.vec(18, 0),
                            this.resources,
                            this.collisionGroups,
                            this.resources.Images.m9,
                            this.player,
                            
        );

        this.weapon = weapon;

        engine.currentScene.add(weapon);

        this.hpBar = new HPBar(this, this.width, 5, this.maxHp, "enemy");
        engine.currentScene.add(this.hpBar);


        engine.currentScene.add(this.particleTimer);
        this.particleTimer.start();
    }

    onPreUpdate(engine: ex.Engine) {
        let frame;
        const bobWalk = [0, -4, -2, 0, -4];
        const bobIdle = [0, 2, 4, 2];

        // Example bob curve (tweak as needed):
        if (this.move.magnitude > 0) {
            frame = this.walkAnim.currentFrameIndex
            // simple 2-pixel bob pattern across frames
            this.bobOffsetY = bobWalk[frame];
        } else if (this.move.magnitude <= 0) {
            frame = this.idleAnim.currentFrameIndex
            this.bobOffsetY = bobIdle[frame];
        }
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        this.moveTimer -= delta;

        if (this.moveTimer <= 0) {
            this.pickRandomDirection();
            this.moveTimer = this.moveCooldown;
        }

        this.shootTimer -= delta;

        this.weapon.shoot();

        if (this.move.magnitude > 0) {
            this.graphics.use("walk");

            const dir = this.move.normalize();
            const step = dir.scale(this.speed * (delta / 1000));

            this.pos.x += step.x;
            this.pos.y += step.y;

            const worldPos = engine.screenToWorldCoordinates(this.player.pos);

            // Face movement direction
            if (worldPos.x < this.pos.x) {
                this.walkAnim.flipHorizontal = true;
                this.idleAnim.flipHorizontal = true;
            } else {
                this.walkAnim.flipHorizontal = false;
                this.idleAnim.flipHorizontal = false;
            }
        } else {
            this.graphics.use("idle");
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
        }
    }

    private pickRandomDirection() {
        const directions = [
            ex.vec(0, -1),  // up
            ex.vec(0, 1),   // down
            ex.vec(-1, 0),  // left
            ex.vec(1, 0),   // right
            ex.vec(-1, -1), // up-left
            ex.vec(1, -1),  // up-right
            ex.vec(-1, 1),  // down-left
            ex.vec(1, 1),   // down-right
            ex.vec(0, 0),   // stand still
        ];

        this.move = directions[Math.floor(Math.random() * directions.length)];
    }
    takeDamage(damage: number) {
        if (this.isDead) return;

        if (this.hp <= damage) {
            this.hp = 0;
            //window.dispatchEvent(new Event("player-damaged"));
            this.handleDeath()
            return;
        }

        this.hp -= damage;
        this.hpBar.setHP(this.hp);
        //window.dispatchEvent(new Event("player-damaged"));
    }
    handleDeath() {
        this.body.collisionType = ex.CollisionType.PreventCollision;
        this.collider.clear();

        this.particleTimer?.cancel();

        this.hpBar.kill();
        this.vel = ex.vec(0, 0);
        this.isDead = true;
        this.kill();
        this.weapon.kill();
        this.shadow.kill();
    }
}

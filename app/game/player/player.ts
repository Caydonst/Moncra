import * as ex from "excalibur";
import {Engine, Resource} from "excalibur";
import {GameResources} from "@/app/ game/resources";
import {collidesWithWall8} from '../utils/checkCollisions'
import {Shadow} from "../utils/shadow";
import {spawnParticles} from "@/app/ game/utils/ParticleHelper";
import { GameScene } from "../scenes/GameScene";
import { multiplayer } from "../network/multiplayer";
import { GameState } from "../gameState/gameState";
import { Inventory } from "../inventory/inventory";

type Stats = {
    speed: number;
    baseSpeed: number;
    damage: number;
    maxHp: number;
    hp: number;
    armor: number;
    crit: number;
}

export class Player extends ex.Actor {
    private stats: Stats = {
        speed: 250,
        baseSpeed: 250,
        damage: 0,
        maxHp: 100,
        hp: 100,
        armor: 0,
        crit: 0,
    }
    private inventory!: Inventory;
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private walkAnim!: ex.Animation;
    private idleAnim!: ex.Animation;
    public move: ex.Vector;
    public bobOffsetY = 0;
    private shadow!: Shadow;
    public isDead: boolean = false;
    private particleTimer!: ex.Timer;

    private isDashing = false;
    private dashCooldown = 3000; // 3 seconds
    private lastDashTime!: number;
    private dashTime = 200; // 0.2 seconds
    private dashSpeed = 1000;
    private dashTracer!: DashTracer;

    private spriteScale = 2.3;

    constructor(pos: ex.Vector, worldWidth: number, worldHeight: number, private resources: GameResources, private collisionGroups: any, private gameState: GameState) {
        super({
            name: "player",
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            width: 11 * 2.3,    // set desired width
            height: 16 * 2.3,   // set desired height
            color: ex.Color.Yellow,  // optional, for debugging
            collisionType: ex.CollisionType.Active,
            z: 3,
            collisionGroup: collisionGroups.playerGroup,
        });
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.move = ex.vec(0, 0);
    }

    onInitialize(engine: Engine) {
        const walkFrames = this.resources.characterWalkSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.scale = ex.vec(this.spriteScale, this.spriteScale);
            //s.width = 15 * 2;
            //s.height = 23 * 2;

            return {
                graphic: s,
                duration: 120
            };
        });
        const idleFrames = this.resources.characterIdleSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.scale = ex.vec(this.spriteScale, this.spriteScale);
            //s.width = this.width;
            //s.height = this.height;

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

        this.dashTracer = new DashTracer(this);
        engine.currentScene.add(this.dashTracer);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

        const random = new ex.Random(); // or pass a seed if you want reproducible randomness

        this.particleTimer = new ex.Timer({
            interval: 0,             // base interval (ms)
            random,                    // Excalibur Random instance
            randomRange: [50, 200],    // add a random float between 50 and 200 ms
            repeats: true,
            action: () => {
                if (this.move.magnitude > 0) {
                    /*(engine.currentScene as GameScene).particleManager.emit(
                        this.pos.add(ex.vec(0, 18)),
                        1,
                        ex.Color.fromHex("#5c5c5c"),
                        0,
                        0,
                        300,
                        3,
                        3,
                        1,
                    );*/
                    (engine.currentScene as GameScene).dustParticleManager.spawnDust(
                        this.pos.add(ex.vec(0, 18)),
                        1
                    );
                }
            },
        });


        engine.currentScene.add(this.particleTimer);
        this.particleTimer.start();
    }

    onPreUpdate(engine: ex.Engine) {
        let frame;
        const bobWalk = [0, 0, 0, 4];
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
        this.move = ex.vec(0, 0);

        // --- Movement input ---
        if (engine.input.keyboard.isHeld(ex.Keys.W)) this.move = this.move.add(ex.vec(0, -1));
        if (engine.input.keyboard.isHeld(ex.Keys.S)) this.move = this.move.add(ex.vec(0, 1));
        if (engine.input.keyboard.isHeld(ex.Keys.A)) this.move = this.move.add(ex.vec(-1, 0));
        if (engine.input.keyboard.isHeld(ex.Keys.D)) this.move = this.move.add(ex.vec(1, 0));

        if (engine.input.keyboard.wasPressed(ex.Keys.Space)) this.dash();

        // --- Normalize diagonal movement ---
        if (this.move.magnitude > 0) {
            this.graphics.use("walk");
            const dir = this.move.normalize();
            const step = dir.scale(this.stats.speed * (delta / 1000));

            this.pos.x += step.x;
            this.pos.y += step.y;
            
        } else if (this.move.magnitude <= 0) {
            this.graphics.use("idle");
        }

        if (this.isDashing) {
            this.updateDash();
        }

        const pointer = engine.input.pointers.primary;

        const worldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);

        if (worldPos.x > this.pos.x) {
            this.walkAnim.flipHorizontal = true;
            this.idleAnim.flipHorizontal = true;
        } else {
            this.walkAnim.flipHorizontal = false;
            this.idleAnim.flipHorizontal = false;
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, (this.height / 2) + 3));
        }

        this.dashTracer?.updateTracer(engine, delta, this.isDashing);

        const aimAngle = worldPos.sub(this.pos).toAngle();

        const equippedWeapon = this.gameState.inventory.weapon?.instance;

        const isAttacking =
        equippedWeapon && "getIsAttacking" in equippedWeapon
            ? equippedWeapon.getIsAttacking()
            : false;

        const attackId =
        equippedWeapon && "getAttackId" in equippedWeapon
            ? equippedWeapon.getAttackId()
            : 0;

        multiplayer.sendPlayerMove({
            x: this.pos.x,
            y: this.pos.y,
            rotation: this.rotation,
            weaponId: this.gameState.inventory.weapon?.id ?? "",
            aimAngle,
            isAttacking,
            attackId,
        });

    }
    takeDamage(damage: number) {
        if (this.isDead) return;

        if (this.stats.hp <= damage) {
            this.stats.hp = 0;
            window.dispatchEvent(new Event("player-damaged"));
            this.isDead = true;
            return;
        }

        this.stats.hp -= damage;
        window.dispatchEvent(new Event("player-damaged"));
    }
    private dash() {
        const now = performance.now()

        if (now - this.lastDashTime < this.dashCooldown) return;

        this.lastDashTime = now;
        this.isDashing = true;
        this.stats.speed = this.dashSpeed;
    }
    private updateDash() {
        const now = performance.now()

        if (now - this.lastDashTime < this.dashTime) return;

        this.stats.speed = this.stats.baseSpeed;
        this.isDashing = false;
    }
    public getStats() {
        return this.stats;
    }
    public attachToScene(scene: ex.Scene) {
        if (!this.shadow || this.shadow.isKilled()) {
            this.shadow = new Shadow(this);
        }
        scene.add(this.shadow);

        if (!this.dashTracer || this.dashTracer.isKilled()) {
            this.dashTracer = new DashTracer(this);
        }
        scene.add(this.dashTracer);

        if (this.particleTimer) {
            this.particleTimer.cancel();
        }

        const random = new ex.Random();

        this.particleTimer = new ex.Timer({
            interval: 0,
            random,
            randomRange: [50, 200],
            repeats: true,
            action: () => {
                if (this.move.magnitude <= 0) return;

                const currentScene = this.scene as any;

                currentScene.dustParticleManager?.spawnDust(
                    this.pos.add(ex.vec(0, 18)),
                    1
                );
            },
        });

        scene.add(this.particleTimer);
        this.particleTimer.start();
    }
}

export class DashTracer extends ex.Actor {
    private points: { pos: ex.Vector; age: number }[] = [];
    private maxAge = 180; // ms
    private sampleTimer = 0;
    private sampleRate = 20; // ms

    constructor(private player: Player) {
        super({
            name: "dash-tracer",
            pos: ex.vec(0, 0),
            z: 2,
            collisionType: ex.CollisionType.PreventCollision,
        });

        this.graphics.onPostDraw = (ctx) => {
            if (this.points.length < 2) return;

            for (let i = 0; i < this.points.length - 1; i++) {
                const a = this.points[i];
                const b = this.points[i + 1];

                const alpha = 1 - a.age / this.maxAge;

                ctx.save();
                ctx.opacity = alpha * 0.6;

                ctx.drawLine(
                    a.pos.sub(this.pos),
                    b.pos.sub(this.pos),
                    ex.Color.White,
                    12 * alpha
                );

                ctx.restore();
            }
        };
    }

    updateTracer(engine: ex.Engine, delta: number, isDashing: boolean) {
        this.pos = engine.currentScene.camera.pos.clone();

        for (const point of this.points) {
            point.age += delta;
        }

        this.points = this.points.filter(point => point.age < this.maxAge);

        if (!isDashing) return;

        this.sampleTimer += delta;

        if (this.sampleTimer >= this.sampleRate) {
            this.sampleTimer = 0;

            this.points.push({
                pos: this.player.pos.clone(),
                age: 0,
            });
        }
    }
}

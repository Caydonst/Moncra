import * as ex from "excalibur";
import {Engine, Resource} from "excalibur";
import {GameResources} from "@/app/ game/resources";
import {collidesWithWall8} from './utils/checkCollisions'
import {Shadow} from "./utils/shadow";
import {spawnParticles} from "@/app/ game/utils/ParticleHelper";
import { GameScene } from "./scenes/GameScene";

export class Player extends ex.Actor {
    private speed: number = 250;
    public maxHp: number = 100;
    public hp: number = this.maxHp;
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private walkAnim: ex.Animation;
    private idleAnim: ex.Animation;
    public move: ex.Vector;
    public bobOffsetY = 0;
    private shadow: Shadow;
    public isDead: boolean = false;

    constructor(x: number, y: number, worldWidth: number, worldHeight: number, private resources: GameResources, private collisionGroups: any) {
        super({
            name: "player",
            pos: ex.vec(x, y),
            anchor: ex.vec(0.5, 0.5),
            width: 15 * 2,    // set desired width
            height: 19 * 2,   // set desired height
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

        const particleTimer = new ex.Timer({
            interval: 0,             // base interval (ms)
            random,                    // Excalibur Random instance
            randomRange: [50, 200],    // add a random float between 50 and 200 ms
            repeats: true,
            action: () => {
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
                        1,
                    );
                }
            },
        });


        engine.currentScene.add(particleTimer);
        particleTimer.start();


        engine.currentScene.add(particleTimer);
        particleTimer.start();
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
        this.move = ex.vec(0, 0);

        // --- Movement input ---
        if (engine.input.keyboard.isHeld(ex.Keys.W)) this.move = this.move.add(ex.vec(0, -1));
        if (engine.input.keyboard.isHeld(ex.Keys.S)) this.move = this.move.add(ex.vec(0, 1));
        if (engine.input.keyboard.isHeld(ex.Keys.A)) this.move = this.move.add(ex.vec(-1, 0));
        if (engine.input.keyboard.isHeld(ex.Keys.D)) this.move = this.move.add(ex.vec(1, 0));

        // --- Normalize diagonal movement ---
        if (this.move.magnitude > 0) {
            this.graphics.use("walk");
            const dir = this.move.normalize();
            const step = dir.scale(this.speed * (delta / 1000));

            this.pos.x += step.x;
            this.pos.y += step.y;
            
        } else if (this.move.magnitude <= 0) {
            this.graphics.use("idle");
        }

        const pointer = engine.input.pointers.primary;

        const worldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);

        if (worldPos.x < this.pos.x) {
            this.walkAnim.flipHorizontal = true;
            this.idleAnim.flipHorizontal = true;
        } else {
            this.walkAnim.flipHorizontal = false;
            this.idleAnim.flipHorizontal = false;
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
        }

    }
    takeDamage(damage: number) {
        if (this.isDead) return;

        if (this.hp <= damage) {
            this.hp = 0;
            window.dispatchEvent(new Event("player-damaged"));
            this.isDead = true;
            return;
        }

        this.hp -= damage;
        window.dispatchEvent(new Event("player-damaged"));
    }
}

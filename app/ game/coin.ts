const ex = await import("excalibur");
import {GameResources} from "./resources";
import { Shadow } from "./utils/shadow";

export class Coin extends ex.Actor {
    private vx: number;
    private vy: number;
    private gravity = 1000;
    private groundY: number;
    private magnetEnabled = false;
    private magnetRange = 150;   // distance at which magnet activates
    private magnetSpeed = 200;   // how fast coin flies to player
    private shadow: Shadow;
    private engine: ex.Engine;

    // 🔥 Bounce physics
    private bouncesRemaining = 3;       // how many bounces to perform
    private bounceEnergy = 0.45;        // how much height remains after each bounce
    private minBounceSpeed = 60;        // stop bouncing when below this speed

    constructor(startPos: ex.Vector, private resources: GameResources) {
        super({
            pos: startPos.clone(),
            anchor: ex.vec(0.5, 0.5),
            width: 6 * 3,
            height: 7 * 3,
            z: 2,
            collisionType: ex.CollisionType.Passive
        });


        // coin sprite
        const sprite = this.resources.Images.coinSheetImage.toSprite();
        this.graphics.use(sprite);

        // RANDOM TARGET LAND POSITION
        const offsetX = (Math.random() * 80) - 40; // -40 to +40
        const offsetY = (Math.random() * 40) + 20; // 20 to 60 downward

        this.groundY = startPos.y + offsetY;

        // POP UPWARD
        this.vy = -300 - Math.random() * 200; // jump force
        this.vx = offsetX / 0.7; // enough horizontal speed to reach target in ~0.7s
    }

    onInitialize(engine: ex.Engine) {
        this.engine = engine;
        // Scale each frame BEFORE making an animation
        const frames = this.resources.CoinSpriteSheet.sprites.map(sprite => {
            const s = sprite.clone();        // clone so you can modify safely
            s.width *= 3;                    // scale X
            s.height *= 3;                   // scale Y

            return {
                graphic: s,
                duration: 150
            };
        });

        const anim = new ex.Animation({
            frames
        });

        this.graphics.use(anim);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const dt = delta / 1000;

        // Apply gravity
        if (this.bouncesRemaining > 0) {
            this.vy += this.gravity * dt;
            // Update position
            this.pos.x += this.vx * dt;
            this.pos.y += this.vy * dt;
        }

        // ---- BOUNCE CHECK ----
        if (this.bouncesRemaining > 0) {
            if (this.pos.y >= this.groundY) {
                this.pos.y = this.groundY;

                if (Math.abs(this.vy) > this.minBounceSpeed) {
                    // reverse velocity to bounce
                    this.vy = -this.vy * this.bounceEnergy;

                    // reduce horizontal speed slightly for realism
                    this.vx *= 0.5;

                    this.bouncesRemaining--;
                } else {
                    // stop movement completely
                    this.vy = 0;
                    this.vx = 0;
                    this.bouncesRemaining = 0;
                }
            }
        }

        // ---- Shadow position ----
        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height));
        }

        // ---- MAGNET LOGIC ----
        const player = engine.currentScene.player

        if (player) {
            const dist = this.pos.distance(player.pos);

            // Enable magnet ONCE
            if (!this.magnetEnabled && dist < this.magnetRange) {
                this.magnetEnabled = true;

                // Turn off physical movement
                this.vx = 0;
                this.vy = 0;
            }

            // If magnet is on, move toward player
            if (this.magnetEnabled) {
                const dir = player.pos.sub(this.pos).normalize();
                this.pos = this.pos.add(dir.scale(this.magnetSpeed * dt));

                if (dist < 30) {
                    this.kill();
                    this.shadow.kill();
                }
            }
        }
    }
}

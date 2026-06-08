const ex = await import("excalibur");
import {GameResources} from '../resources';
import { Player } from '../player/player';
import { Demon } from "../enemies/demon";
import {Shadow} from "../utils/shadow";

export class WarHammer extends ex.Actor {
    public player: Player;
    public engine: ex.Engine;
    public offset: ex.Vector;
    private shadow: Shadow;

    private swinging = false;
    private swingProgress = 0;
    private swingDuration = 500;

    private restAngle = 0;
    private swingOutAngle = 0;

    private hasExploded = false;

    private readonly ROT_OFFSET = Math.PI / 2;
    private side: 1 | -1 = -1;
    private swingCooldown = 1000;
    private lastSwingTime = 0;

    private baseOffset = ex.vec(0, 0);


    constructor(
        player: Player,
        engine: ex.Engine,
        offset: ex.Vector = ex.vec(40, 0),
        private resources: GameResources,
    ) {
        super({
            pos: player.pos.clone().add(offset),
            anchor: ex.vec(0.5, 0.5),
            //width: resources.Images.warHammer.width * 2.8,
            //height: resources.Images.warHammer.height * 2.8,
            z: 4
        });

        this.player = player;
        this.engine = engine;
        this.offset = offset;

    }

    onInitialize(engine: ex.Engine) {
        //const base = this.resources.Images.warHammer.toSprite();
        //base.width = this.width;
        //base.height = this.height;

        //this.graphics.use(base);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    private getMouseAngle(): number | null {
        const pointer = this.engine.input.pointers.primary;
        if (!pointer.lastScreenPos) return null;

        const worldPos = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
        return worldPos.sub(this.player.pos).toAngle();
    }

    startSwing() {
        const now = performance.now();

        if (now - this.lastSwingTime < this.swingCooldown) return;
        if (this.swinging) return;

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        // ✅ We are actually starting a swing now,
        // so record the time for cooldown.
        this.lastSwingTime = now;

        this.swinging = true;
        this.swingProgress = 0;
        this.hasExploded = false;

        this.restAngle = mouseAngle + this.side * Math.PI;
        this.swingOutAngle = this.restAngle + (Math.PI) * (this.side * -1);
    }

    private spawnExplosion(engine: ex.Engine, pos: ex.Vector) {
        const damageRadius = 80;

        const explosion = new ex.Actor({
            pos: pos.clone(),
            radius: damageRadius,
            color: ex.Color.Gray,
            opacity: 0.8,
            z: 1
        });

        explosion.scale = ex.vec(0.5, 0.5);
        this.engine.currentScene.add(explosion);

        // Screen shake
        this.engine.currentScene.camera.shake(10, 10, 80);

        // Damage enemies
        const enemies = engine.currentScene.actors.filter(actor => actor instanceof Demon);
        enemies.forEach(enemy => {
            const distance = explosion.pos.distance(enemy.pos);
            if (distance <= damageRadius) {
                enemy.takeDamage(50);
            }
        });

        explosion.actions
            .scaleTo(ex.vec(1, 1), ex.vec(10, 10))
            .fade(0, 150)
            .callMethod(() => explosion.kill());
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const mouseAngle = this.getMouseAngle();
        if (!mouseAngle) return;

        const addBobbing = (offset: ex.Vector) => {
            return offset.add(ex.vec(0, this.player.bobOffsetY));
        };

        // Determine side of player
        const pointer = this.engine.input.pointers.primary;
        if (pointer.lastScreenPos) {
            const worldMouse = this.engine.screenToWorldCoordinates(pointer.lastScreenPos);
            const mouseIsRight = worldMouse.x > this.player.pos.x;
            this.side = mouseIsRight ? -1 : 1;
            this.graphics.current.flipHorizontal = this.side === 1;
        }

        let finalOffset: ex.Vector;
        let finalAngle: number;

        // ----------------------------------------------------
        // 🔥 HANDLE SWINGING
        // ----------------------------------------------------
        if (this.swinging) {
            this.swingProgress += delta;
            const t = Math.min(this.swingProgress / this.swingDuration, 1);

            // Ping-pong easing
            let swingT = t < 0.5 ? (t / 0.5) : (1 - (t - 0.5) / 0.5);
            const eased = swingT * swingT * (3 - 2 * swingT);

            const angle = this.restAngle + (this.swingOutAngle - this.restAngle) * eased;

            // Rotated + bobbed + base offset
            const rotated = this.offset.rotate(angle);
            finalOffset = addBobbing(rotated).add(this.baseOffset);
            finalAngle = angle;

            // Explosion at mid swing
            if (!this.hasExploded && t >= 0.5) {
                const basePos = this.player.pos.add(this.offset.rotate(this.swingOutAngle));
                const forward = ex.vec(Math.cos(this.swingOutAngle), Math.sin(this.swingOutAngle));
                const hammerTip = basePos.add(forward.scale(this.height / 2));
                this.spawnExplosion(engine, hammerTip);
                this.hasExploded = true;
            }

            if (t === 1) this.swinging = false;
        }

            // ----------------------------------------------------
            // 🟩 IDLE (no swing)
        // ----------------------------------------------------
        else {
            const angle = mouseAngle + this.side * Math.PI;
            const rotated = this.offset.rotate(angle);
            finalOffset = addBobbing(rotated).add(this.baseOffset);
            finalAngle = angle;
        }

        // ----------------------------------------------------
        // 🎯 APPLY FINAL RESULTS
        // ----------------------------------------------------
        this.pos = this.player.pos.add(finalOffset);
        this.rotation = finalAngle + this.ROT_OFFSET;

        // ----------------------------------------------------
        // 🟥 ALWAYS UPDATE SHADOW (both swing + idle)
        // ----------------------------------------------------
        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2 + 5));
        }
    }
    addListeners() {
        this.engine.input.pointers.primary.on("down", () => this.startSwing());
    }
    cleanup() {
        this.engine.input.pointers.primary.off("down");
        this.shadow.kill()
    }
}

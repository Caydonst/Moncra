import * as ex from "excalibur"
import { GameResources } from "./resources";
import { Shadow } from "./utils/shadow";
import { Player } from "./player";
import { GameScene } from "./scenes/GameScene";

export class Portal extends ex.Actor {
    private portalAnim!: ex.Animation
    private portalSelectedAnim!: ex.Animation
    private shadow!: Shadow;
    private baseY: number = 0;
    private floatTime: number = 0;
    private player!: Player;

    constructor(pos: ex.Vector, private resources: GameResources) {
        super({
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            width: 64,
            height: 64,
            collisionType: ex.CollisionType.PreventCollision,
            z: 5,
        })
    }

    onInitialize(engine: ex.Engine): void {
        this.baseY = this.pos.y;

        const portalFrames = this.resources.portalSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();
            s.scale = ex.vec(4, 4);

            return {
                graphic: s,
                duration: 100
            };
        });

        const portalSelectedFrames = this.resources.portalSelectedSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();
            s.scale = ex.vec(4, 4);
            
            return {
                graphic: s,
                duration: 100
            };
        });

        this.portalAnim = new ex.Animation({
            frames: portalFrames
        });

        this.portalSelectedAnim = new ex.Animation({
            frames: portalSelectedFrames
        });

        this.graphics.add("portal", this.portalAnim);
        this.graphics.add("portalSelected", this.portalSelectedAnim);
        this.graphics.use("portal");

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

        this.player = engine.currentScene.player;

        engine.input.keyboard.on("press", (evt) => {
            if (evt.key === ex.Keys.F) {
                if (this.pos.distance(this.player.pos) < 100) {
                    window.dispatchEvent(new Event("dungeon-menu-open"));
                }
            }
        });
    }
    onPostUpdate(engine: ex.Engine, elapsed: number): void {

        const dist = this.pos.distance(this.player.pos);

        if (dist < 100) {
            this.graphics.use("portalSelected");
        } else {
            this.graphics.use("portal");
        }

        // elapsed is milliseconds
        this.floatTime += elapsed;

        // Float settings
        const amplitude = 5; // how high
        const speed = 0.003; // movement speed

        this.pos.y =
            this.baseY +
            Math.sin(this.floatTime * speed) * amplitude;

        const floatOffset =
            Math.sin(this.floatTime * speed) * amplitude;

        this.pos.y = this.baseY + floatOffset;

        if (this.shadow) {
            // keep shadow fixed on ground
            this.shadow.pos = ex.vec(
                this.pos.x - 12,
                this.baseY + this.height + 40
            );

            // normalize float height
            const normalized =
                (floatOffset + amplitude) / (amplitude * 2);

            // smaller when higher
            const shadowScale =
                1.2 - normalized * 0.2;

            this.shadow.scale = ex.vec(
                shadowScale * 1.5,
                shadowScale * 0.6
            );
        }
    }
}
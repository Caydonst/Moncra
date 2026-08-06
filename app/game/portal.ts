import * as ex from "excalibur";

import { GameResources } from "./resources";
import { Shadow } from "./utils/shadow";
import { Player } from "./player/player";

type PortalType = "hub" | "dungeon";

export class Portal extends ex.Actor {
    private portalAnim!: ex.Animation;
    private portalSelectedAnim!: ex.Animation;
    private shadow!: Shadow;

    private engine!: ex.Engine;
    private player!: Player;

    private baseY = 0;
    private floatTime = 0;

    private interactionEnabled = false;
    private keyboardListenerRegistered = false;

    private readonly selectDistance = 100;

    public interacted = false;

    constructor(
        pos: ex.Vector,
        private resources: GameResources,
        private type: PortalType
    ) {
        super({
            pos,
            anchor: ex.vec(0.5, 0.5),
            width: 64,
            height: 64,
            collisionType: ex.CollisionType.PreventCollision,
            z: 5,
        });
    }

    public onInitialize(engine: ex.Engine): void {
        this.engine = engine;
        this.baseY = this.pos.y;

        this.setupGraphics();

        const scenePlayer = (
            this.scene as ex.Scene & {
                player?: Player;
            }
        ).player;

        if (!scenePlayer) {
            throw new Error(
                "Portal requires its scene to have a player."
            );
        }

        this.player = scenePlayer;

        this.registerKeyboardListener();

        this.shadow = new Shadow(this);

        if (this.scene) {
            this.scene.add(this.shadow);
        }
    }

    private setupGraphics(): void {
        const portalFrames =
            this.resources.portalSpritesheet.sprites.map(
                (sprite) => {
                    const frame = sprite.clone();

                    frame.scale = ex.vec(4, 4);

                    return {
                        graphic: frame,
                        duration: 100,
                    };
                }
            );

        const portalSelectedFrames =
            this.resources.portalSelectedSpritesheet.sprites.map(
                (sprite) => {
                    const frame = sprite.clone();

                    frame.scale = ex.vec(4, 4);

                    return {
                        graphic: frame,
                        duration: 100,
                    };
                }
            );

        this.portalAnim = new ex.Animation({
            frames: portalFrames,
        });

        this.portalSelectedAnim = new ex.Animation({
            frames: portalSelectedFrames,
        });

        this.graphics.add(
            "portal",
            this.portalAnim
        );

        this.graphics.add(
            "portalSelected",
            this.portalSelectedAnim
        );

        this.graphics.use("portal");
    }

    private registerKeyboardListener(): void {
        if (this.keyboardListenerRegistered) {
            return;
        }

        this.engine.input.keyboard.on(
            "press",
            this.handleKeyPress
        );

        this.keyboardListenerRegistered = true;
    }

    private unregisterKeyboardListener(): void {
        if (!this.keyboardListenerRegistered) {
            return;
        }

        this.engine.input.keyboard.off(
            "press",
            this.handleKeyPress
        );

        this.keyboardListenerRegistered = false;
    }

    private handleKeyPress = (
        event: ex.KeyEvent
    ): void => {
        if (event.key !== ex.Keys.F) {
            return;
        }

        if (!this.canInteract()) {
            return;
        }

        const distance =
            this.pos.distance(this.player.pos);

        if (distance > this.selectDistance) {
            return;
        }

        if (this.type === "hub") {
            window.dispatchEvent(
                new CustomEvent("dungeon-menu-open", {
                    detail: {
                        open: true,
                    },
                })
            );

            return;
        }

        if (this.type === "dungeon") {
            this.interacted = true;
        }
    };

    private canInteract(): boolean {
        if (!this.interactionEnabled) {
            return false;
        }

        if (!this.scene) {
            return false;
        }

        if (this.scene !== this.engine.currentScene) {
            return false;
        }

        if (!this.player || this.player.isKilled()) {
            return false;
        }

        if (this.isKilled()) {
            return false;
        }

        return true;
    }

    public setInteractionEnabled(
        enabled: boolean
    ): void {
        this.interactionEnabled = enabled;

        if (!enabled) {
            this.interacted = false;
            this.graphics.use("portal");
        }
    }

    public onPostUpdate(
        _engine: ex.Engine,
        elapsed: number
    ): void {
        /*
         * The floating animation can still run whenever the actor
         * is active in its scene, but interaction graphics should
         * only react when this scene is current.
         */
        if (this.canInteract()) {
            const distance =
                this.pos.distance(this.player.pos);

            if (distance <= this.selectDistance) {
                this.graphics.use("portalSelected");
            } else {
                this.graphics.use("portal");
            }
        } else {
            this.graphics.use("portal");
        }

        this.floatTime += elapsed;

        const amplitude = 5;
        const speed = 0.003;

        const floatOffset =
            Math.sin(this.floatTime * speed) *
            amplitude;

        this.pos.y =
            this.baseY + floatOffset;

        if (this.shadow) {
            this.shadow.pos = ex.vec(
                this.pos.x - 12,
                this.baseY +
                this.height +
                40
            );

            const normalized =
                (floatOffset + amplitude) /
                (amplitude * 2);

            const shadowScale =
                1.2 - normalized * 0.2;

            this.shadow.scale = ex.vec(
                shadowScale * 1.5,
                shadowScale * 0.6
            );
        }
    }

    public onPreKill(
        _scene: ex.Scene
    ): void {
        this.interacted = false;

        this.unregisterKeyboardListener();

        if (
            this.shadow &&
            !this.shadow.isKilled()
        ) {
            this.shadow.kill();
        }
    }
}
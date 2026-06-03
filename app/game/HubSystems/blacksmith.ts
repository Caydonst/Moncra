import type {Ammunition, Item, Weapon} from "@/app/game/items/ItemTypes";

const ex = await import("excalibur");
import {GameResources} from "../resources";
import { Player } from "../player/player";
import {Shadow} from "../utils/shadow";
import {Coin} from "../coin";



export class Blacksmith extends ex.Actor {
    private player!: Player;
    private open: boolean = false;
    private idleAnim!: ex.Animation;
    private selectedAnim!: ex.Animation;
    private shadow!: Shadow;
    private engine!: ex.Engine;
    private animationDone = false;
    private selectDistance = 120;

    constructor(pos: ex.Vector, private resources: GameResources, public items: (Item | Weapon | Ammunition | null)[]) {
        super({
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            height: resources.Images.blacksmithSheetImage.height * 3,
            width: (resources.Images.blacksmithSheetImage.width / 4) * 3,
            collisionType: ex.CollisionType.Fixed,
            z: 2,
        })
    }

    onInitialize(engine: ex.Engine) {
        this.engine = engine;

        const idleFrames = this.resources.blacksmithSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();
            s.width = this.width;
            s.height = this.height;
            return {
                graphic: s,
                duration: 180
            };
        });

        const selectedFrames = this.resources.blacksmithSelectedSpritesheet.sprites.map(sprite => {
            const s = sprite.clone();
            s.width = 24 * 3;
            s.height = 28 * 3;
            return {
                graphic: s,
                duration: 180
            };
        });

        this.idleAnim = new ex.Animation({
            frames: idleFrames
        });

        this.selectedAnim = new ex.Animation({
            frames: selectedFrames
        });
        // store graphics
        this.graphics.add("idle", this.idleAnim);
        this.graphics.add("selected", this.selectedAnim);

        this.graphics.use("idle");

        this.player = engine.currentScene.player;

        // register F key once
        engine.input.keyboard.on("press", (evt) => {
            if (evt.key === ex.Keys.F) {
                if (this.open) {
                    window.dispatchEvent(new Event("blacksmith-closed"));
                    this.open = false;
                } else {
                    if (this.pos.distance(this.player.pos) < this.selectDistance) {
                        this.openBlacksmith();
                    }
                }
            }
        });

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    onPostUpdate(_engine: ex.Engine, _delta: number) {

        const dist = this.pos.distance(this.player.pos);

        if (!this.open) {
            if (dist < this.selectDistance) {
                this.graphics.use("selected");
            } else {
                this.graphics.use("idle");
            }
        }

        if (dist > 200) {
            if (this.open) {
                window.dispatchEvent(new Event("blacksmith-closed"));
                this.open = false;
            }
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
        }
    }

    openBlacksmith() {
        this.open = true;
        window.dispatchEvent(
            new CustomEvent("blacksmith-opened", {
                detail: {
                    items: this.items,
                    chest: this,
                },
            })
        );
    }
    removeItem(index: number) {
        this.items[index] = null;

        window.dispatchEvent(
            new CustomEvent("chest-items-updated", {
                detail: {
                    items: [...this.items],
                },
            })
        );
    }
}
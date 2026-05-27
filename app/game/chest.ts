import type {Ammunition, Item, Weapon} from "@/app/game/items/ItemTypes";

const ex = await import("excalibur");
import {GameResources} from "./resources";
import { Player } from "./player/player";
import {Shadow} from "./utils/shadow";
import {Coin} from "./coin";



export class Chest extends ex.Actor {
    private player!: Player;
    private open: boolean = false;
    private chestAnim!: ex.Animation;
    private shadow!: Shadow;
    private engine!: ex.Engine;
    private animationDone = false;

    constructor(pos: ex.Vector, private resources: GameResources, public items: (Item | Weapon | Ammunition | null)[]) {
        super({
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            height: resources.Images.chest.height * 3,
            width: resources.Images.chest.width * 3,
            collisionType: ex.CollisionType.Fixed,
            z: 3,
        })
    }

    onInitialize(engine: ex.Engine) {
        this.engine = engine;

        const chestSprite = this.resources.Images.chest.toSprite();
        chestSprite.width = this.width;
        chestSprite.height = this.height;
        const chestSelectedSprite = this.resources.Images.chestSelected.toSprite();
        chestSelectedSprite.width = this.resources.Images.chestSelected.width * 3;
        chestSelectedSprite.height = this.resources.Images.chestSelected.height * 3;
        const chestOpenSprite = this.resources.Images.chestOpen.toSprite();
        chestOpenSprite.width = this.width;
        chestOpenSprite.height = this.height;

        const chestFrames = this.resources.chestSpriteSheet.sprites.map(sprite => {
            const s = sprite.clone();
            s.width = this.width;
            s.height = this.height;
            return s;
        });

        this.chestAnim = new ex.Animation({
            frames: chestFrames.map(sprite => ({
                graphic: sprite,
                duration: 200,
                loop: false,
            })),
            strategy: ex.AnimationStrategy.Freeze
        });

        // store graphics
        this.graphics.add("closed", chestSprite);
        this.graphics.add("openAnim", this.chestAnim);
        this.graphics.add("open", chestOpenSprite);
        this.graphics.add("selected", chestSelectedSprite);

        this.graphics.use("closed");

        this.player = engine.currentScene.player;

        // register F key once
        engine.input.keyboard.on("press", (evt) => {
            if (evt.key === ex.Keys.F) {
                if (this.open) {
                    window.dispatchEvent(new Event("chest-closed"));
                    this.open = false;
                    this.chestAnim.reset();
                } else {
                    if (this.pos.distance(this.player.pos) < 60) {
                        this.openChest();
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
            if (dist < 60) {
                this.graphics.use("selected");
            } else {
                this.graphics.use("closed");
                this.chestAnim.reset();
            }
        }

        if (dist > 200) {
            if (this.open) {
                window.dispatchEvent(new Event("chest-closed"));
                this.open = false;
            }
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height/2));
        }
    }

    openChest() {
        this.graphics.use("openAnim");
        this.open = true;
        window.dispatchEvent(
            new CustomEvent("chest-opened", {
                detail: {
                    items: this.items,
                    chest: this,
                },
            })
        );
    }
    spawnCoins(count: number = 2) {
        for (let i = 0; i < count; i++) {
            const coin = new Coin(this.pos.clone(), this.resources);
            this.engine.currentScene.add(coin);
        }
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
import type {Ammunition, Item, Weapon} from "@/app/game/items/ItemTypes";

const ex = await import("excalibur");
import {GameResources} from "../resources";
import { Player } from "../player/player";
import {Shadow} from "../utils/shadow";
import {Coin} from "../coin";
import { GroundItem } from "./GroundItem";



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
            z: 2,
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
                if (!this.open && this.pos.distance(this.player.pos) < 60) {
                    this.openChest();
                }
            }
        });

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    onPostUpdate(_engine: ex.Engine, _delta: number) {
        if (this.open) {
            if (this.shadow) {
                this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
            }
            return;
        }

        const dist = this.pos.distance(this.player.pos);

        if (dist < 60) {
            this.graphics.use("selected");
        } else {
            this.graphics.use("closed");
            this.chestAnim.reset();
        }

        this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
    }

    openChest() {
        if (this.open) return;

        this.graphics.use("openAnim");
        this.open = true;

        this.spawnItems();
        this.spawnCoins(10)

        this.items = [];
    }

    spawnItems() {
        const inventory = this.engine.currentScene.gameState.inventory;

        const validItems = this.items.filter(
            (item): item is Item | Weapon | Ammunition => item !== null
        );

        validItems.forEach((item) => {
            const chestTop = this.pos.add(ex.vec(0, -20));
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            const landingPos = this.pos.add(ex.Vector.fromAngle(angle).scale(distance));

            const groundItem = new GroundItem(
                this.pos.clone(),
                item,
                inventory,
            );

            this.engine.currentScene.add(groundItem);
        });
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
import type {Item, Material, Weapon} from "@/app/game/items/ItemTypes";

const ex = await import("excalibur");
import {GameResources} from "../resources";
import { Player } from "../player/player";
import {Shadow} from "../utils/shadow";
import {Coin} from "../coin";
import { Armor } from "../armor/armor";



export class StorageChest extends ex.Actor {
    private player!: Player;
    private open: boolean = false;
    private chestAnim!: ex.Animation;
    private shadow!: Shadow;
    private engine!: ex.Engine;
    private animationDone = false;
    private selectDistance = 140;
    miscWeapons: (Weapon | null)[] = Array(12).fill(null);
    miscArmor: (Armor | null)[] = Array(12).fill(null);
    miscMaterial: (Material | null)[] = Array(12).fill(null);

    constructor(pos: ex.Vector, private resources: GameResources) {
        super({
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            height: resources.Images.storageChest.height * 6,
            width: resources.Images.storageChest.width * 6,
            collisionType: ex.CollisionType.Fixed,
            z: 2,
        })
    }

    onInitialize(engine: ex.Engine) {
        this.engine = engine;

        const chestSprite = this.resources.Images.storageChest.toSprite();
        chestSprite.width = this.width;
        chestSprite.height = this.height;
        const chestSelectedSprite = this.resources.Images.storageChestSelected.toSprite();
        chestSelectedSprite.width = this.resources.Images.storageChestSelected.width * 6;
        chestSelectedSprite.height = this.resources.Images.storageChestSelected.height * 6;
        const chestOpenSprite = this.resources.Images.storageChestOpen.toSprite();
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
                    window.dispatchEvent(new Event("storage-closed"));
                    this.open = false;
                    this.chestAnim.reset();
                } else {
                    if (this.pos.distance(this.player.pos) < this.selectDistance) {
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
            if (dist < this.selectDistance) {
                this.graphics.use("selected");
            } else {
                this.graphics.use("closed");
                this.chestAnim.reset();
            }
        }

        if (dist > 220) {
            if (this.open) {
                window.dispatchEvent(new Event("storage-closed"));
                this.open = false;
            }
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2 - 10));
        }
    }

    openChest() {
        this.graphics.use("open");
        this.open = true;
        window.dispatchEvent(
            new CustomEvent("storage-opened", {
                detail: {
                    storage: this,
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
    addItem(item: Weapon | Armor | Material) {
        let slot = 0;
        switch(item.type) {
            
            case "Weapon":

                slot = this.miscWeapons.indexOf(null);
                this.miscWeapons[slot] = item;
                break;

            case "Armor":
                
                slot = this.miscArmor.indexOf(null);
                this.miscArmor[slot] = item;
                break;

            case "Material":
                slot = this.miscMaterial.indexOf(null);
                this.miscMaterial[slot] = item;
                break;

            default:
                break;
        }

        return slot;
    }
    removeItem(item: Weapon | Armor | Material) {
        if (item.type === "Weapon") {
            const mi = this.miscWeapons.findIndex(m => m?.id === item.id);
            if (mi !== -1) {
                this.miscWeapons[mi] = null;
            }
        } else if (item.type === "Armor") {
            const mi = this.miscArmor.findIndex(m => m?.id === item.id);
            if (mi !== -1) {
                this.miscArmor[mi] = null;
            }
        } else if (item.type === "Material") {
            const mi = this.miscMaterial.findIndex(m => m?.id === item.id);
            if (mi !== -1) {
                this.miscMaterial[mi] = null;
            }
        }
    }
    getItems() {
        return {
            weapons: this.miscWeapons,
            armor: this.miscArmor,
            material: this.miscMaterial,
        };
    }
    applyServerStorage(serverStorage: Partial<StorageChest>) {
        this.miscWeapons = serverStorage.miscWeapons ?? Array(12).fill(null);
        this.miscArmor = serverStorage.miscArmor ?? Array(12).fill(null);
        this.miscMaterial = serverStorage.miscMaterial ?? Array(12).fill(null);
    }
}
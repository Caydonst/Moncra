import type {
    Material,
    Weapon,
} from "@/app/game/items/ItemTypes";

const ex = await import("excalibur");

import { GameResources } from "../resources";
import { Player } from "../player/player";
import { Shadow } from "../utils/shadow";
import { Coin } from "../coin";
import { Armor } from "../armor/armor";

export class StorageChest extends ex.Actor {
    private player!: Player;
    private engine!: ex.Engine;

    private open = false;
    private interactionEnabled = false;
    private keyboardListenerRegistered = false;

    private chestAnim!: ex.Animation;
    private shadow!: Shadow;

    private readonly selectDistance = 140;
    private readonly closeDistance = 220;

    miscWeapons: (Weapon | null)[] =
        Array(12).fill(null);

    miscArmor: (Armor | null)[] =
        Array(12).fill(null);

    miscMaterial: (Material | null)[] =
        Array(12).fill(null);

    constructor(
        pos: ex.Vector,
        private resources: GameResources
    ) {
        super({
            pos,
            anchor: ex.vec(0.5, 0.5),
            height:
                resources.Images.storageChest.height * 6,
            width:
                resources.Images.storageChest.width * 6,
            collisionType: ex.CollisionType.Fixed,
            z: 2,
        });
    }

    public onInitialize(engine: ex.Engine): void {
        this.engine = engine;

        this.setupGraphics();

        const scenePlayer = (
            this.scene as ex.Scene & {
                player?: Player;
            }
        ).player;

        if (!scenePlayer) {
            throw new Error(
                "StorageChest requires its scene to have a player."
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
        const chestSprite =
            this.resources.Images.storageChest.toSprite();

        chestSprite.width = this.width;
        chestSprite.height = this.height;

        const chestSelectedSprite =
            this.resources.Images.storageChestSelected.toSprite();

        chestSelectedSprite.width =
            this.resources.Images.storageChestSelected.width *
            6;

        chestSelectedSprite.height =
            this.resources.Images.storageChestSelected.height *
            6;

        const chestOpenSprite =
            this.resources.Images.storageChestOpen.toSprite();

        chestOpenSprite.width = this.width;
        chestOpenSprite.height = this.height;

        const chestFrames =
            this.resources.chestSpriteSheet.sprites.map(
                (sprite) => {
                    const frame = sprite.clone();

                    frame.width = this.width;
                    frame.height = this.height;

                    return frame;
                }
            );

        this.chestAnim = new ex.Animation({
            frames: chestFrames.map((sprite) => ({
                graphic: sprite,
                duration: 200,
            })),
            strategy: ex.AnimationStrategy.Freeze,
        });

        this.graphics.add(
            "closed",
            chestSprite
        );

        this.graphics.add(
            "openAnim",
            this.chestAnim
        );

        this.graphics.add(
            "open",
            chestOpenSprite
        );

        this.graphics.add(
            "selected",
            chestSelectedSprite
        );

        this.graphics.use("closed");
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

        if (this.open) {
            this.closeChest();
            return;
        }

        const distance =
            this.pos.distance(this.player.pos);

        if (distance <= this.selectDistance) {
            this.openChest();
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

        return true;
    }

    public setInteractionEnabled(
        enabled: boolean
    ): void {
        this.interactionEnabled = enabled;

        if (!enabled) {
            this.closeChest();
            this.graphics.use("closed");
            this.chestAnim.reset();
        }
    }

    public onPostUpdate(
        _engine: ex.Engine,
        _delta: number
    ): void {
        /*
         * This actor normally only updates while its scene is
         * active, but this guard ensures it cannot manipulate UI
         * or graphics while another scene is active.
         */
        if (!this.canInteract()) {
            return;
        }

        const distance =
            this.pos.distance(this.player.pos);

        if (!this.open) {
            if (distance <= this.selectDistance) {
                this.graphics.use("selected");
            } else {
                this.graphics.use("closed");
                this.chestAnim.reset();
            }
        }

        if (
            this.open &&
            distance > this.closeDistance
        ) {
            this.closeChest();
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(
                ex.vec(
                    0,
                    this.height / 2 - 10
                )
            );
        }
    }

    public openChest(): void {
        if (!this.canInteract()) {
            return;
        }

        if (this.open) {
            return;
        }

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

    public closeChest(): void {
        if (!this.open) {
            return;
        }

        this.open = false;

        this.graphics.use("closed");
        this.chestAnim.reset();

        window.dispatchEvent(
            new Event("storage-closed")
        );
    }

    public spawnCoins(
        count: number = 2
    ): void {
        if (!this.scene) {
            return;
        }

        for (let i = 0; i < count; i++) {
            const coin = new Coin(
                this.pos.clone(),
                this.resources
            );

            this.scene.add(coin);
        }
    }

    public addItem(
        item: Weapon | Armor | Material
    ): number {
        switch (item.type) {
            case "Weapon": {
                const slot =
                    this.miscWeapons.indexOf(null);

                if (slot === -1) {
                    return -1;
                }

                this.miscWeapons[slot] = item;
                return slot;
            }

            case "Armor": {
                const slot =
                    this.miscArmor.indexOf(null);

                if (slot === -1) {
                    return -1;
                }

                this.miscArmor[slot] = item;
                return slot;
            }

            case "Material": {
                const slot =
                    this.miscMaterial.indexOf(null);

                if (slot === -1) {
                    return -1;
                }

                this.miscMaterial[slot] = item;
                return slot;
            }
        }
    }

    public removeItem(
        item: Weapon | Armor | Material
    ): void {
        if (item.type === "Weapon") {
            const index =
                this.miscWeapons.findIndex(
                    (storedItem) =>
                        storedItem?.id === item.id
                );

            if (index !== -1) {
                this.miscWeapons[index] = null;
            }

            return;
        }

        if (item.type === "Armor") {
            const index =
                this.miscArmor.findIndex(
                    (storedItem) =>
                        storedItem?.id === item.id
                );

            if (index !== -1) {
                this.miscArmor[index] = null;
            }

            return;
        }

        if (item.type === "Material") {
            const index =
                this.miscMaterial.findIndex(
                    (storedItem) =>
                        storedItem?.id === item.id
                );

            if (index !== -1) {
                this.miscMaterial[index] = null;
            }
        }
    }

    public getItems() {
        return {
            weapons: this.miscWeapons,
            armor: this.miscArmor,
            material: this.miscMaterial,
        };
    }

    public applyServerStorage(
        serverStorage: Partial<StorageChest>
    ): void {
        this.miscWeapons =
            serverStorage.miscWeapons ??
            Array(12).fill(null);

        this.miscArmor =
            serverStorage.miscArmor ??
            Array(12).fill(null);

        this.miscMaterial =
            serverStorage.miscMaterial ??
            Array(12).fill(null);
    }

    public onPreKill(
        _scene: ex.Scene
    ): void {
        this.closeChest();
        this.unregisterKeyboardListener();

        if (
            this.shadow &&
            !this.shadow.isKilled()
        ) {
            this.shadow.kill();
        }
    }
}
import type { Ammunition, Item, Weapon } from "@/app/game/items/ItemTypes";
import * as ex from "excalibur";
import { Player } from "../player/player";
import { Inventory } from "../inventory/inventory";
import { Shadow } from "../utils/shadow";
import { EnchantedGlowEffect, GlowEffect } from "../utils/swordOutline";

type GroundItemData = Item | Weapon | Ammunition;

export class GroundItem extends ex.Actor {
    private vx: number;
    private vy: number;
    private gravity = 1500;
    private groundY: number;
    private magnetEnabled = false;
    private magnetRange = 150;   // distance at which magnet activates
    private magnetSpeed = 500;   // how fast coin flies to player
    private shadow!: Shadow;
    private engine?: ex.Engine;

    // 🔥 Bounce physics
    private bouncesRemaining = 3;       // how many bounces to perform
    private bounceEnergy = 0.45;        // how much height remains after each bounce
    private minBounceSpeed = 60;        // stop bouncing when below this speed
    private landed = false;
    private canCollect = false;

    constructor(
        startPos: ex.Vector,
        private item: GroundItemData,
        private inventory: Inventory,
    ) {
        super({
            pos: startPos.clone(),
            width: 28,
            height: 28,
            anchor: ex.vec(0.5, 0.5),
            collisionType: ex.CollisionType.Passive,
            z: 999,
        });

        // RANDOM TARGET LAND POSITION
        const offsetX = (Math.random() * 80) - 40; // -40 to +40
        const offsetY = (Math.random() * 40) + 40; // 20 to 60 downward

        this.groundY = startPos.y + offsetY;

        // POP UPWARD
        this.vy = -400 - Math.random() * 200; // jump force
        this.vx = offsetX / 0.7; // enough horizontal speed to reach target in ~0.7s
    }

    onInitialize(engine: ex.Engine) {
        this.player = engine.currentScene.player;

        const sprite = this.item.gameIcon.toSprite();
        sprite.width = 28;
        sprite.height = 28;
        this.graphics.use(sprite);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

        const effect = new GlowEffect(engine);
        this.graphics.material = effect.material;
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
                this.landed = true;
                this.canCollect = true;
                this.canMagnet = true;

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

        if (player && this.landed) {
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
                    if (this.item.type === "Material") {
                        this.inventory.addItem({
                            ...this.item,
                            quantity: 1,
                        });
                    }
                    else {
                        this.inventory.addItem(this.item);
                    }

                    this.cleanup();
                }
            }
        }
            
    }
    cleanup() {
        this.kill();
        this.shadow.kill();
    }
}
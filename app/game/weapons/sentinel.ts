import * as ex from "excalibur";
import { GreatSword } from "./sword";
import { Player } from "../player/player";
import { GameResources } from "../resources";
import type { Weapon } from "../items/ItemTypes";
import { multiplayer } from "../network/multiplayer";

export class Sentinel extends GreatSword {
    private guardStance = false;
    private baseSpeed = 250;

    private guardMoveSpeedMultiplier = 0.6;
    private guardDamageReduction = 0.50;

    private isCharging = false;

    constructor(
        player: Player,
        engine: ex.Engine,
        resources: GameResources,
        collisionGroups: any,
        damage: number,
        image: ex.ImageSource,
        shouldFlip: boolean,
        weaponItem: Weapon
    ) {
        super(
            player,
            engine,
            resources,
            collisionGroups,
            damage,
            image,
            shouldFlip,
            weaponItem
        );
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        if (
            this.isHolding &&
            engine.input.keyboard.isHeld(ex.Keys.ShiftLeft) &&
            !this.isCharging
        ) {
            multiplayer.sendSentinelChargeStart();
            this.startChargeAttackVisual();
        }

        if (engine.input.keyboard.wasPressed(ex.Keys.E)) {
            multiplayer.sendSentinelGuardToggle();

            if (this.guardStance) {
                this.exitGuardStanceVisual();
            } else {
                this.enterGuardStanceVisual();
            }
        }

        super.onPostUpdate(engine, delta);
    }

    private startChargeAttackVisual() {
        if (this.swinging || this.thrusting || this.isBlocking) return;

        this.isCharging = true;
        this.isHolding = false;
    }

    private releaseChargeAttackVisual(chargeResolveUsed: number = 0) {
        if (!this.isCharging) return;

        this.isCharging = false;

        const mouseAngle = this.getMouseAngle();
        if (mouseAngle === null) return;

        const chargeMultiplier = chargeResolveUsed * 0.06;

        this.currentAttack = {
            type: "slash",
            duration: 350,
            cooldown: 500,
            damageMultiplier: chargeMultiplier,
            startOffset: Math.PI / 1.15,
            endOffset: -Math.PI / 1.15,
            swingFlip: false,
        };

        this.swingDuration = this.currentAttack.duration;
        this.swingCooldown = this.currentAttack.cooldown;
        this.swingProgress = 0;
        this.swingHitSet.clear();

        this.startSlash(mouseAngle);

        this.swingTracer.start(
            this.player,
            this.swingStartAngle,
            this.swingEndAngle,
            this.swingDuration,
            this.offset.x + 25,
            () => this.player.pos.clone().add(ex.vec(0, this.player.bobOffsetY))
        );
    }

    private enterGuardStanceVisual() {
        if (this.guardStance) return;

        this.guardStance = true;

        const stats = this.player.getStats();

        stats.baseSpeed = this.baseSpeed * this.guardMoveSpeedMultiplier;
        stats.speed = stats.baseSpeed;

        this.blockDamageMultiplier = 1 - this.guardDamageReduction;
    }

    private exitGuardStanceVisual() {
        if (!this.guardStance) return;

        this.guardStance = false;

        const stats = this.player.getStats();

        stats.baseSpeed = this.baseSpeed;
        stats.speed = stats.baseSpeed;

        this.blockDamageMultiplier = 0.5;
    }

    protected onSuccessfulHit(_target: ex.Actor) {
        multiplayer.sendSentinelSuccessfulHit();
    }

    public onBlockedAttack(perfectBlock: boolean) {
        multiplayer.sendSentinelBlockedAttack(perfectBlock);
    }

    public isBlockingNow() {
        return this.isBlocking;
    }

    public getDamageReduction() {
        return this.guardDamageReduction;
    }

    public isInGuardStance() {
        return this.guardStance;
    }

    private onServerChargeAttack = (event: CustomEvent) => {
        const { chargeResolveUsed } = event.detail;

        this.releaseChargeAttackVisual(chargeResolveUsed);
    };

    addListeners() {
        const pointer = this.engine.input.pointers.primary;

        pointer.on("down", this.sentinelPointerDown);
        pointer.on("up", this.sentinelPointerUp);

        window.addEventListener("sentinel-charge-attack", this.onServerChargeAttack as EventListener);
    }

    cleanup() {
        window.removeEventListener("sentinel-charge-attack", this.onServerChargeAttack as EventListener);
        const pointer = this.engine.input.pointers.primary;

        pointer.off("down", this.sentinelPointerDown);
        pointer.off("up", this.sentinelPointerUp);

        super.cleanup();
    }

    private sentinelPointerDown = (evt: ex.PointerEvent) => {
        if (evt.button === ex.PointerButton.Left) {
            this.isHolding = true;
        }

        if (evt.button === ex.PointerButton.Right) {
            this.startBlock();
            multiplayer.sendSentinelBlockStart();
        }
    };

    private sentinelPointerUp = (evt: ex.PointerEvent) => {
        if (evt.button === ex.PointerButton.Left) {
            this.isHolding = false;

            const mouseAngle = this.getMouseAngle();

            if (mouseAngle !== null) {
                multiplayer.sendSentinelChargeRelease({ aimAngle: mouseAngle });
            }
        }

        if (evt.button === ex.PointerButton.Right) {
            this.stopBlock();
            multiplayer.sendSentinelBlockEnd();
        }
    };
}
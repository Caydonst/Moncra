import type * as ex from "excalibur";
import type {
    Material,
    Weapon,
    Armor,
} from "../items/ItemTypes";

type EquippedWeaponActor = ex.Actor & {
    attachToScene(scene: ex.Scene): void;
    detachFromScene(scene: ex.Scene): void;
};

let equippedWeaponInstance:
    EquippedWeaponActor | null = null;

let equippedWeaponUid:
    string | null = null;

let spawningEquippedWeapon = false;

function getWeaponUid(
    weapon: Weapon | null
): string | null {
    if (!weapon) {
        return null;
    }

    return weapon.uid ?? weapon.id;
}

function destroyWeaponActor(
    instance: EquippedWeaponActor,
    fallbackScene?: ex.Scene
): void {
    const owningScene =
        instance.scene ?? fallbackScene;

    if (owningScene) {
        instance.detachFromScene(
            owningScene
        );
    }

    if (!instance.isKilled()) {
        instance.kill();
    }
}

export class Inventory {
    weapon: Weapon | null = null;

    helmet: Armor | null = null;
    arms: Armor | null = null;
    chest: Armor | null = null;
    legs: Armor | null = null;

    lantern: Lantern | null = null;

    miscWeapons: (Weapon | null)[] =
        Array(12).fill(null);

    miscArmor: (Armor | null)[] =
        Array(12).fill(null);

    miscMaterial: (Material | null)[] =
        Array(12).fill(null);

    gold = 0;

    constructor(data?: Partial<Inventory>) {
        if (!data) {
            return;
        }

        this.weapon =
            data.weapon ?? null;

        this.helmet =
            data.helmet ?? null;

        this.arms =
            data.arms ?? null;

        this.chest =
            data.chest ?? null;

        this.legs =
            data.legs ?? null;

        this.lantern =
            data.lantern ?? null;

        this.miscWeapons =
            data.miscWeapons ??
            Array(12).fill(null);

        this.miscArmor =
            data.miscArmor ??
            Array(12).fill(null);

        this.miscMaterial =
            data.miscMaterial ??
            Array(12).fill(null);

        this.gold =
            data.gold ?? 0;

        /*
         * When server inventory updates create a new Inventory
         * object, reconnect the existing actor to the matching
         * equipped weapon object.
         */
        const weaponUid =
            getWeaponUid(this.weapon);

        if (
            this.weapon &&
            equippedWeaponInstance &&
            !equippedWeaponInstance.isKilled() &&
            equippedWeaponUid === weaponUid
        ) {
            this.weapon.instance =
                equippedWeaponInstance;
        }
    }

    async spawnEquippedWeapon(
        engine: ex.Engine
    ): Promise<void> {
        const weapon = this.weapon;

        if (!weapon) {
            return;
        }

        if (spawningEquippedWeapon) {
            return;
        }

        spawningEquippedWeapon = true;

        try {
            const scene =
                engine.currentScene;

            const weaponUid =
                getWeaponUid(weapon);

            /*
             * If this exact weapon already has a live actor,
             * do not destroy and recreate it. Attach it to the
             * active scene instead.
             */
            if (
                equippedWeaponInstance &&
                !equippedWeaponInstance.isKilled() &&
                equippedWeaponUid === weaponUid
            ) {
                weapon.instance =
                    equippedWeaponInstance;

                equippedWeaponInstance
                    .attachToScene(scene);

                await this.syncMultiplayerWeapon(
                    weapon
                );

                return;
            }

            /*
             * A different weapon is currently spawned.
             * Properly detach its helpers before killing it.
             */
            if (
                equippedWeaponInstance &&
                !equippedWeaponInstance.isKilled()
            ) {
                destroyWeaponActor(
                    equippedWeaponInstance,
                    scene
                );
            }

            equippedWeaponInstance = null;
            equippedWeaponUid = null;

            if (!weapon.createWeapon) {
                console.warn(
                    "Weapon has no createWeapon function:",
                    weapon
                );

                return;
            }

            const instance =
                await weapon.createWeapon() as
                EquippedWeaponActor;

            equippedWeaponInstance =
                instance;

            equippedWeaponUid =
                weaponUid;

            weapon.instance =
                instance;

            /*
             * Critical change:
             * This adds the weapon and all helper actors.
             */
            instance.attachToScene(
                scene
            );

            await this.syncMultiplayerWeapon(
                weapon
            );
        } finally {
            spawningEquippedWeapon = false;
        }
    }

    async removeEquippedWeaponActor(
        engine: ex.Engine | null
    ): Promise<void> {
        const instance =
            equippedWeaponInstance ??
            (
                this.weapon?.instance as
                EquippedWeaponActor |
                undefined
            );

        if (instance) {
            destroyWeaponActor(
                instance,
                engine?.currentScene
            );
        }

        equippedWeaponInstance = null;
        equippedWeaponUid = null;

        if (this.weapon) {
            this.weapon.instance =
                undefined;
        }

        await this.syncMultiplayerWeapon(
            null
        );
    }

    async syncMultiplayerWeapon(
        weapon: Weapon | null
    ): Promise<void> {
        if (
            typeof window ===
            "undefined"
        ) {
            return;
        }

        const { multiplayer } =
            await import(
                "../network/multiplayer"
            );

        multiplayer.setLocalWeapon(
            weapon?.instance ?? null
        );

        if (weapon) {
            multiplayer.sendEquipWeapon(
                weapon.id
            );
        }
    }

    public getEquippedWeaponActor() {
        return equippedWeaponInstance;
    }

    public async attachEquippedWeaponToScene(
        engine: ex.Engine,
        scene: ex.Scene
    ): Promise<void> {
        if (!this.weapon) {
            return;
        }

        /*
         * Spawn an actor only when one does not exist.
         */
        if (
            !equippedWeaponInstance ||
            equippedWeaponInstance.isKilled()
        ) {
            await this.spawnEquippedWeapon(engine);
            return;
        }

        /*
         * Restore the client-only instance reference onto the
         * latest server-hydrated weapon object.
         */
        this.weapon.instance =
            equippedWeaponInstance;

        equippedWeaponInstance.attachToScene(
            scene
        );

        await this.syncMultiplayerWeapon(
            this.weapon
        );
    }

    public detachEquippedWeaponFromScene(
        scene: ex.Scene
    ): void {
        if (
            !equippedWeaponInstance ||
            equippedWeaponInstance.isKilled()
        ) {
            return;
        }

        equippedWeaponInstance.detachFromScene(
            scene
        );
    }

    applyServerInventory(
        serverInventory: Inventory
    ): void {
        this.weapon =
            serverInventory.weapon;

        this.helmet =
            serverInventory.helmet;

        this.arms =
            serverInventory.arms;

        this.chest =
            serverInventory.chest;

        this.legs =
            serverInventory.legs;

        this.miscWeapons =
            serverInventory.miscWeapons;

        this.miscArmor =
            serverInventory.miscArmor;

        this.miscMaterial =
            serverInventory.miscMaterial;

        this.gold =
            serverInventory.gold;

        /*
         * Restore the non-serializable client actor reference.
         */
        if (
            this.weapon &&
            equippedWeaponInstance &&
            !equippedWeaponInstance.isKilled()
        ) {
            this.weapon.instance =
                equippedWeaponInstance;
        }
    }

    clone(): Inventory {
        return new Inventory({
            weapon: this.weapon,
            helmet: this.helmet,
            arms: this.arms,
            chest: this.chest,
            legs: this.legs,
            lantern: this.lantern,
            miscWeapons: [
                ...this.miscWeapons,
            ],
            miscArmor: [
                ...this.miscArmor,
            ],
            miscMaterial: [
                ...this.miscMaterial,
            ],
            gold: this.gold,
        });
    }
}
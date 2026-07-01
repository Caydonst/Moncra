import type { Material, Weapon, Armor } from "../items/ItemTypes";

let equippedWeaponInstance: any = null;
let spawningEquippedWeapon = false;

export class Inventory {
    weapon: Weapon | null = null;
    helmet: Armor | null = null;
    arms: Armor | null = null;
    chest: Armor | null = null;
    legs: Armor | null = null;

    miscWeapons: (Weapon | null)[] = Array(12).fill(null);
    miscArmor: (Armor | null)[] = Array(12).fill(null);
    miscMaterial: (Material | null)[] = Array(12).fill(null);

    gold = 0;

    private spawningWeapon = false;

    constructor(data?: Partial<Inventory>) {
        if (!data) return;

        this.weapon = data.weapon ?? null;
        this.helmet = data.helmet ?? null;
        this.arms = data.arms ?? null;
        this.chest = data.chest ?? null;
        this.legs = data.legs ?? null;
        this.miscWeapons = data.miscWeapons ?? Array(12).fill(null);
        this.miscArmor = data.miscArmor ?? Array(12).fill(null);
        this.miscMaterial = data.miscMaterial ?? Array(12).fill(null);
        this.gold = data.gold ?? 0;
    }

    async spawnEquippedWeapon(engine: ex.Engine) {
        if (!this.weapon) return;
        if (spawningEquippedWeapon) return;

        const scene = engine.currentScene;

        if (equippedWeaponInstance && !equippedWeaponInstance.isKilled()) {
            equippedWeaponInstance.cleanup?.();
            equippedWeaponInstance.kill();
            scene.remove(equippedWeaponInstance);
            equippedWeaponInstance = null;
        }

        spawningEquippedWeapon = true;

        try {
            if (!this.weapon.createWeapon) {
                console.warn("Weapon has no createWeapon function:", this.weapon);
                return;
            }

            const instance = await this.weapon.createWeapon();

            equippedWeaponInstance = instance;
            this.weapon.instance = instance;

            scene.add(instance);
            instance.addListeners?.();

            await this.syncMultiplayerWeapon(this.weapon);
        } finally {
            spawningEquippedWeapon = false;
        }
    }

    async removeEquippedWeaponActor(engine: ex.Engine | null) {
        const scene = engine?.currentScene;

        const instance = equippedWeaponInstance ?? this.weapon?.instance;
        if (!instance) return;

        instance.cleanup?.();
        instance.kill();

        if (scene) {
            scene.remove(instance);
        }

        equippedWeaponInstance = null;

        if (this.weapon) {
            this.weapon.instance = undefined;
        }

        await this.syncMultiplayerWeapon(null);
    }

    async syncMultiplayerWeapon(weapon: Weapon | null) {
        if (typeof window === "undefined") return;

        const { multiplayer } = await import("../network/multiplayer");

        multiplayer.setLocalWeapon(weapon?.instance ?? null);

        if (weapon) {
            multiplayer.sendEquipWeapon(weapon.id);
        }
    }

    applyServerInventory(serverInventory: Inventory) {
        this.weapon = serverInventory.weapon;
        this.armor = serverInventory.armor;
        this.miscWeapons = serverInventory.miscWeapons;
        this.miscArmor = serverInventory.miscArmor;
        this.miscMaterial = serverInventory.miscMaterial;
        this.gold = serverInventory.gold;
    }

    clone() {
        return new Inventory({
            weapon: this.weapon,
            armor: this.armor,
            miscWeapons: [...this.miscWeapons],
            miscArmor: [...this.miscArmor],
            miscMaterial: [...this.miscMaterial],
            gold: this.gold,
        });
    }
}
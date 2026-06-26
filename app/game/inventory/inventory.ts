import type { Material, Weapon } from "../items/ItemTypes";
import { Armor } from "../armor/armor";

export class Inventory {
    weapon: Weapon | null = null;
    armor: Armor | null = null;

    miscWeapons: (Weapon | null)[] = Array(12).fill(null);
    miscArmor: (Armor | null)[] = Array(12).fill(null);
    miscMaterial: (Material | null)[] = Array(12).fill(null);

    gold = 0;

    private spawningWeapon = false;

    constructor(data?: Partial<Inventory>) {
        if (!data) return;

        this.weapon = data.weapon ?? null;
        this.armor = data.armor ?? null;
        this.miscWeapons = data.miscWeapons ?? Array(12).fill(null);
        this.miscArmor = data.miscArmor ?? Array(12).fill(null);
        this.miscMaterial = data.miscMaterial ?? Array(12).fill(null);
        this.gold = data.gold ?? 0;
    }

    async spawnEquippedWeapon(engine: ex.Engine) {
        if (!this.weapon) return;
        if (this.spawningWeapon) return;
        if (this.weapon.instance && !this.weapon.instance.isKilled()) return;

        this.spawningWeapon = true;

        try {
            const scene = engine.currentScene;

            if (!this.weapon.createWeapon) {
                console.warn("Weapon has no createWeapon function:", this.weapon);
                return;
            }

            const instance = await this.weapon.createWeapon();

            if (this.weapon.instance && !this.weapon.instance.isKilled()) {
                instance.kill();
                return;
            }

            this.weapon.instance = instance;

            scene.add(instance);
            instance.addListeners?.();
            instance.sendResourceData?.();

            await this.syncMultiplayerWeapon(this.weapon);
        } finally {
            this.spawningWeapon = false;
        }
    }

    async removeEquippedWeaponActor(engine: ex.Engine | null) {
        const weapon = this.weapon;
        if (!weapon?.instance) return;

        weapon.instance.cleanup?.();
        weapon.instance.kill();

        if (engine?.currentScene) {
            engine.currentScene.remove(weapon.instance);
        }

        weapon.instance = undefined;

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
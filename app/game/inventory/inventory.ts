import type { Material, Weapon } from "../items/ItemTypes";
import { Armor } from "../armor/armor";

export class Inventory {
    weapon: Weapon | null = null;
    armor: Armor | null = null;

    miscWeapons: (Weapon | null)[] = Array(12).fill(null);
    miscArmor: (Armor | null)[] = Array(12).fill(null);
    miscMaterial: (Material | null)[] = Array(12).fill(null);

    gold = 0;

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

        const scene = engine.currentScene;

        if (!this.weapon.createWeapon) {
            console.warn("Weapon has no createWeapon function:", this.weapon);
            return;
        }

        // avoid duplicate actor
        this.removeEquippedWeaponActor(engine);

        const instance = await this.weapon.createWeapon();

        scene.add(instance);
        instance.addListeners?.();

        this.weapon.instance = instance;
        this.weapon.instance?.sendResourceData?.();
    }

    async removeEquippedWeaponActor(engine: ex.Engine | null) {
        if (!this.weapon?.instance) return;

        this.weapon.instance.cleanup?.();

        if (engine?.currentScene) {
            engine.currentScene.remove(this.weapon.instance);
        }

        this.weapon.instance = undefined;
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
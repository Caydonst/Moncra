import { Armor } from "../armor/armor";
import type {Ammunition, Item, Weapon} from "../items/ItemTypes";

export class Inventory {
    weapon: Weapon | null = null;
    armor: Armor | null = null;
    misc: (Item | Weapon | Armor | null)[] = Array(24).fill(null);

    addItem(item: Item | Weapon | Armor): boolean {

        const slot = this.misc.indexOf(null);
        if (slot === -1) return false;
        this.misc[slot] = item;

        /*
        if (item.type === "weapon") {
            this.weapon = item;
        }
        else if (item.type === "armor") {
            const slot = this.armor.indexOf(null);
            if (slot === -1) return false;
            this.armor[slot] = item;
        }
        else {
            const slot = this.misc.indexOf(null);
            if (slot === -1) return false;
            this.misc[slot] = item;
        }
         */
        return true;
    }

    removeItem(item: Item | Weapon | Armor) {
        if (this.weapon?.id === item.id) {
            this.weapon = null;
        }

        if (this.armor?.id === item.id) {
            this.armor = null;
        }

        const mi = this.misc.findIndex(m => m?.id === item.id);
        if (mi !== -1) {
            this.misc[mi] = null;
        }
    }

    equip(item: Weapon | Armor, engine: ex.Engine, miscIndex?: number) {
        if (item.type === "Armor") {
            this.equipArmor(item, miscIndex);
        } else {
            this.equipWeapon(item, engine, miscIndex);
        }
    }

    unequip(item: Weapon | Armor, engine: ex.Engine | null) {
        if (item.type === "Armor") {
            this.unequipArmor(item);
        } else {
            this.unequipWeapon(item, engine?.currentScene);
        }
    }

    equipWeapon(weapon: Weapon, engine: ex.Engine, miscIndex?: number) {
        const scene = engine.currentScene;
        const previousWeapon = this.weapon;

        // remove previous equipped actor
        this.unequipWeapon(previousWeapon, scene);

        if (!weapon.createWeapon) {
            console.warn("Weapon item has no createWeapon function:", weapon);
            return;
        }

        // remove newly equipped weapon from misc
        if (miscIndex !== undefined && miscIndex >= 0) {
            this.misc[miscIndex] = null;
        }

        const instance = weapon.createWeapon();

        if (scene) {
            scene.add(instance);
        }

        instance.addListeners?.();

        weapon.instance = instance;
        this.weapon = weapon;
    }
    unequipWeapon(weapon: Weapon | null, scene: ex.Scene | null) {
        if (!weapon) return;

        if (weapon.instance) {
            weapon.instance.cleanup?.();

            if (scene) {
                scene.remove(weapon.instance);
            }

            weapon.instance = undefined;
        }

        const openSlot = this.misc.indexOf(null);

        if (openSlot === -1) {
            console.warn("No open slot to unequip weapon");
            return;
        }

        this.weapon = null;
        this.misc[openSlot] = weapon;
    }

    equipArmor(armor: Armor, miscIndex: number) {
        if (armor.type !== "Armor") return;
        this.armor = armor;

        if (miscIndex !== undefined && miscIndex >= 0) {
            this.misc[miscIndex] = null;
        }
    }

    unequipArmor(armor: Armor) {
        const openSlot = this.misc.indexOf(null);

        if (openSlot === -1) {
            console.warn("No open slot to unequip armor");
            return;
        }

        this.armor = null;
        this.misc[openSlot] = armor;
    }
}

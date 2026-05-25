import type {Ammunition, Item, Weapon} from "../items/ItemTypes";

export class Inventory {
    weapon: Weapon | null = null;
    armor: (Item | null)[] = [null, null, null]; // 3 armor slots
    misc: (Item | Weapon | Ammunition | null)[] = Array(24).fill(null);

    addItem(item: Item | Weapon | Ammunition): boolean {

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

    removeItem(item: Item | Weapon | Ammunition) {
        if (this.weapon?.id === item.id) this.weapon = null;

        const ai = this.armor.findIndex(a => a?.id === item.id);
        if (ai !== -1) this.armor[ai] = null;

        const mi = this.misc.findIndex(m => m?.id === item.id);
        if (mi !== -1) this.misc[mi] = null;
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

        if (weapon?.instance) {
            weapon.instance.cleanup?.();

            if (scene) {
                scene.remove(weapon.instance);
            }

            weapon.instance = undefined;
        }

        this.weapon = null;

        const openSlot = this.misc.indexOf(null);
        this.misc[openSlot] = weapon;
    }

    equipArmor(slotIndex: number, item: Item) {
        if (item.type !== "armor") return;
        this.armor[slotIndex] = item;
    }
}

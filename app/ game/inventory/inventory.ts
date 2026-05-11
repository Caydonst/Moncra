import type {Ammunition, Item, Weapon} from "../items/ItemTypes";
const ex = await import("excalibur");
import {Player} from "../player"

export class Inventory {
    primary: Weapon | null = null;
    secondary: Weapon | null = null;
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
        if (this.primary?.id === item.id) this.primary = null;

        const ai = this.armor.findIndex(a => a?.id === item.id);
        if (ai !== -1) this.armor[ai] = null;

        const mi = this.misc.findIndex(m => m?.id === item.id);
        if (mi !== -1) this.misc[mi] = null;
    }

    equipWeapon(item: Weapon, scene: ex.Scene | null) {

        // Remove previous equipped weapon
        if (this.primary?.instance) {
            this.primary.instance.cleanup?.();
            if (scene) {
                scene.remove(this.primary.instance);
            }
            this.primary.instance = undefined;
        }

        if (!item.createWeapon) {
            console.warn("Weapon item has no createWeapon function:", item);
            return;
        }

        // Create a fresh weapon actor every time
        const instance = item.createWeapon();

        if (scene) {
            scene.add(instance);
        }
        instance.addListeners?.();

        item.instance = instance;
        this.primary = item;
    }

    equipArmor(slotIndex: number, item: Item) {
        if (item.type !== "armor") return;
        this.armor[slotIndex] = item;
    }
}

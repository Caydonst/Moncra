import styles from "./page.module.css"
import { Inventory } from "../inventory/inventory"
import {Ammunition, Item, Weapon} from "../items/ItemTypes";
import React, {SetStateAction} from "react";
import type { GameScene } from "../scenes/GameScene";
import {XMarkIcon} from "@heroicons/react/24/solid"

type Props = {
    chest: any;
    chestOpen: boolean;
    inventoryOpen: boolean;
    inventory: Inventory | null;
    chestItems: (Item | Weapon | Ammunition | null)[];
    setChestItems: React.Dispatch<SetStateAction<(Item | Weapon | Ammunition | null)[]>>;
    scene: GameScene | null;
}

export default function ChestUI({ chest, chestOpen, inventoryOpen, inventory, chestItems, setChestItems, scene }: Props) {

    function handleChestItemClick(item: Item | Weapon | Ammunition | null, index: number) {
        if (!item) return;

        inventory?.addItem(item);
        chest.removeItem(index);

    }

    return (
        <div className={chestOpen ? `${styles.chestWrapper} ${styles.open}` : styles.chestWrapper}>
            <div className={styles.chest}>
                <h3>Chest</h3>
                <div className={styles.inventoryInner}>
                    <div id="misc-grid" className={styles.miscGrid}>
                        {chestItems && (
                            chestItems.map((slot, i) => (
                                <div key={i} id={`misc-slot-${i}`}  className={styles.slot} onClick={() => handleChestItemClick(slot, i)}>
                                    {slot && <img src={slot.icon} className={slot.type === "pistol" && "stats" in slot ? styles.pistolImg : styles.otherImg} />}
                                    {slot && "amount" in slot && (
                                        <p className={slot.amount <= 0 ? styles.magEmpty : styles.magNotEmpty}>{slot.amount}/{slot.maxAmount}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
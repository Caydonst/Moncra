import styles from "./chest.module.css"
import { Inventory } from "../../inventory/inventory"
import {Ammunition, Item, Weapon} from "../../items/ItemTypes";
import React, {SetStateAction} from "react";
import type { GameScene } from "../../scenes/GameScene";
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

const colors = {
    tempered: {
        hex: "#32FF9C",
        rgba: "rgba(50, 255, 156, 0.3)",
    },
    runed: {
        hex: "#FFE032",
        rgba: "rgba(255, 224, 50, 0.3)",
    },
    exalted: {
        hex: "#FF3232",
        rgba: "rgba(255, 50, 50, 0.3)",
    },
    ascendant: {
        hex: "#F132FF",
        rgba: "rgba(241, 50, 255, 0.3)",
    },
    mythic: {
        hex: "#32FFFF",
        rgba: "rgba(50, 255, 255, 0.3)",
    },
    relic: {
        hex: "#FF4E32",
        rgba: "rgba(255, 78, 50, 0.3)",
    },
}

export default function ChestUI({ chest, chestOpen, inventoryOpen, inventory, chestItems, setChestItems, scene }: Props) {
    const [hoveredItem, setHoveredItem] = React.useState<Item | Weapon | Ammunition | null>(null);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

    function handleChestItemClick(item: Item | Weapon | Ammunition | null, index: number) {
        if (!item) return;

        inventory?.addItem(item);
        chest.removeItem(index);

    }

    function handleMouseMove(e: React.MouseEvent, item: Item | Weapon | Ammunition | null) {
        if (!item) return;

        setHoveredItem(item);
        setTooltipPos({
            x: e.clientX + 12,
            y: e.clientY + 12,
        });
    }

    return (
        <div className={`${styles.chestWrapper} ${chestOpen ? styles.open : ""}`}>
            <div className={styles.chest}>
                <h3>CHEST</h3>
                <div className={styles.inventoryInner}>
                    <div id="misc-grid" className={styles.miscGrid}>
                        {chestItems && (
                            chestItems.map((slot, i) => (
                                <div key={i} id={`misc-slot-${i}`} className={`${styles.slot} ${slot ? styles[slot.rarity] : ""}`} onClick={() => handleChestItemClick(slot, i)} onMouseMove={(e) => handleMouseMove(e, slot)}
                                     onMouseLeave={() => setHoveredItem(null)}>
                                    {slot && <img src={slot.icon} className={styles.slotImg} />}
                                    {slot && "amount" in slot && (
                                        <p className={slot.amount <= 0 ? styles.magEmpty : styles.magNotEmpty}>{slot.amount}/{slot.maxAmount}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div className={`${styles.inventory} ${chestOpen ? styles.open : ""}`}>
                <h3>INVENTORY</h3>
                <div className={styles.inventoryInner}>
                    <div id="misc-grid" className={styles.miscGrid}>
                        {inventory?.misc.map((slot, i) => (
                            <div key={i} id={`misc-slot-${i}`} className={`${styles.slot} ${slot ? styles[slot.rarity] : ""}`}>
                                {slot && <img src={slot.icon} className={styles.slotImg} />}

                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {hoveredItem && (
                <div
                    className={styles.itemTooltip}
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        color: colors[hoveredItem.rarity].hex
                    }}
                >
                    <p className={`${styles.tooltipName} ${styles[hoveredItem.rarity]}`}>{hoveredItem.name}</p>
                </div>
            )}
        </div>
    )
}
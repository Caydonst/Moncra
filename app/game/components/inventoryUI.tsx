import styles from "./page.module.css"
import { Inventory } from "../inventory/inventory"
import {Ammunition, Item, Weapon} from "../items/ItemTypes";
import React from "react";
import type { GameScene } from "../scenes/GameScene";
import {XMarkIcon} from "@heroicons/react/24/solid"

type Props = {
    inventoryOpen: boolean;
    inventory: Inventory | null;
    itemPanelOpen: boolean;
    setItemPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedItem: Item | Weapon | Ammunition| null;
    setSelectedItem: React.Dispatch<React.SetStateAction<Item | Weapon | Ammunition | null>>;
    scene: GameScene | null;
}

export default function InventoryUI({ inventoryOpen, inventory, itemPanelOpen, setItemPanelOpen, selectedItem, setSelectedItem, scene }: Props) {
    const [hoveredItem, setHoveredItem] = React.useState<Item | Weapon | Ammunition | null>(null);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

    function openItemPanel(slot: any) {
        setSelectedItem(slot);
        if (slot) {
            setItemPanelOpen(true);
        }
    }

    function handleMouseMove(e: React.MouseEvent, item: Item | Weapon | Ammunition | null | undefined) {
        if (!item) return;

        setHoveredItem(item);
        setTooltipPos({
            x: e.clientX + 12,
            y: e.clientY + 12,
        });
    }

    return (
        <div id="inventory-wrapper" className={inventoryOpen ? `${styles.inventoryWrapper} ${styles.open}` : styles.inventoryWrapper} onClick={(e) => e.stopPropagation()}>
            <div id="inventory" className={styles.inventory}>
                <h3>Inventory</h3>
                <div className={styles.inventoryInner}>
                    <div className={styles.gearContainer}>
                        <div className={styles.weaponSlotsWrapper}>
                            <div id="weapon-slot" className={styles.weaponSlot} onClick={() => openItemPanel(inventory?.primary)}onMouseMove={(e) => handleMouseMove(e, inventory?.primary)}
                                 onMouseLeave={() => setHoveredItem(null)}>
                                <p>Primary</p>
                                {inventory?.primary && (
                                    <img src={inventory.primary.icon} className={inventory.primary.type === "pistol" && "stats" in inventory.primary ? styles.pistolImg : styles.otherImg} />
                                )}
                            </div>
                            <div id="weapon-slot" className={styles.weaponSlot} onClick={() => openItemPanel(inventory?.secondary)} onMouseMove={(e) => handleMouseMove(e, inventory?.secondary)}
                                 onMouseLeave={() => setHoveredItem(null)}>
                                <p>Secondary</p>
                                {inventory?.secondary && (
                                    <img src={inventory.secondary.icon} className={inventory.secondary.type === "pistol" && "stats" in inventory.secondary ? styles.pistolImg : styles.otherImg} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div id="misc-grid" className={styles.miscGrid}>
                        {inventory?.misc.map((slot, i) => (
                            <div key={i} id={`misc-slot-${i}`}  className={styles.slot} onClick={() => openItemPanel(slot)} onMouseMove={(e) => handleMouseMove(e, slot)}
                                 onMouseLeave={() => setHoveredItem(null)}>
                                {slot && <img src={slot.icon} className={slot.type === "pistol" && "stats" in slot ? styles.pistolImg : styles.otherImg} />}
                                {slot && "amount" in slot && (
                                    <p className={slot.amount <= 0 ? styles.magEmpty : styles.magNotEmpty}>{slot.amount}/{slot.maxAmount}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div id="item-info-panel" className={itemPanelOpen ? `${styles.itemInfoPanel} ${styles.open}` : styles.itemInfoPanel}>
                <button id="item-info-close" className={styles.closeBtn} onClick={() => setItemPanelOpen(false)}>
                    <XMarkIcon className={styles.closeIcon} />
                </button>
                <div className={styles.itemIconContainer}>
                    {selectedItem && (
                        <>
                            <img src={selectedItem.icon} className={selectedItem.type === "pistol" && "stats" in selectedItem ? styles.selectedPistolImg : styles.selectedOtherImg} />
                            <div className={`${styles.bgLight} ${styles[`${selectedItem.rarity}`]}`}></div>
                        </>
                    )}
                </div>
                {selectedItem && (
                    <div className={styles.nameContainer}>
                        <p>{selectedItem.name}</p>
                        <p className={styles[`${selectedItem.rarity}`]}>{selectedItem.rarity.toUpperCase()}</p>
                    </div>
                )}
                <div className={styles.itemDescContainer}>
                    <div id="item-info-text">
                        <h1 id="item-info-name"></h1>
                        <p id="item-info-type"></p>
                    </div>
                    <p id="item-info-description"></p>
                    <div id="item-info-stats"></div>
                    {selectedItem && "magazine" in selectedItem && (
                        <div id="button-container" className={styles.equipBtnContainer}>
                            <button id="equip-btn" className={styles.equipBtn} onClick={() => {
                                inventory?.equipWeapon(selectedItem, scene)
                                setItemPanelOpen(false);
                            }}>Equip</button>
                        </div>
                    )}
                </div>
            </div>
            {hoveredItem && (
                <div
                    className={styles.itemTooltip}
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                    }}
                >
                    <p className={`${styles.tooltipName} ${styles[hoveredItem.rarity]}`}>{hoveredItem.name}</p>
                </div>
            )}
        </div>
    )
}
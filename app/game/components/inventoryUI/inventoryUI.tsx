import styles from "./inventory.module.css"
import { Inventory } from "../../inventory/inventory"
import {Ammunition, Item, Weapon} from "../../items/ItemTypes";
import React, { useEffect, useState } from "react";
import type { GameScene } from "../../scenes/GameScene";
import {XMarkIcon} from "@heroicons/react/24/solid"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIconImg from "../../assets/misc/damage_icon.png"

type Props = {
    inventoryOpen: boolean;
    setInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    inventory: Inventory | null;
    itemPanelOpen: boolean;
    setItemPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedItem: Item | Weapon | null;
    setSelectedItem: React.Dispatch<React.SetStateAction<Item | Weapon | Ammunition | null>>;
    engine: ex.Engine | null;
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

export default function InventoryUI({ inventoryOpen, setInventoryOpen, inventory, itemPanelOpen, setItemPanelOpen, selectedItem, setSelectedItem, engine }: Props) {
    const [selected, setSelected] = useState<number>(-1);

    function openItemPanel(slot: any) {
        setSelectedItem(slot);
        if (slot) {
            setItemPanelOpen(true);
        }
    }

    useEffect(() => {
        if (!inventoryOpen) {
            setSelectedItem(null);
            setSelected(-1);
        }
    })

    return (
        <div id="inventory-wrapper" className={inventoryOpen ? `${styles.inventoryWrapper} ${styles.open}` : styles.inventoryWrapper} onClick={(e) => e.stopPropagation()}>
            <div id="inventory" className={styles.inventoryContainer}>
                <button id="item-info-close" className={styles.closeBtn} onClick={() => setInventoryOpen(false)}>
                    <XMarkIcon className={styles.closeIcon} />
                </button>
                <div className={styles.gearContainer}>
                    <div className={styles.weaponSlotWrapper}>
                        <p>Equipment</p>
                        <div 
                            className={
                                `${styles.weaponSlot} ${selected === 0 ? styles.selected : ""}`
                            } 
                            style={{
                                background: `linear-gradient(
                                    to right,
                                    ${colors[inventory?.weapon?.rarity]?.rgba ?? "rgba(255,255,255,0.1)"},
                                    transparent
                                )`,
                                borderLeft: `3px solid ${
                                    colors[inventory?.weapon?.rarity]?.hex ?? "#808080"
                                }`
                            }} 
                            onClick={() => {
                                openItemPanel(inventory?.weapon); 
                                setSelected(0);
                            }}>
                            
                            {inventory?.weapon ? (
                                <>
                                <img src={inventory.weapon.icon} className={styles.gearImg} />
                                <div className={styles.equippedWeaponInfoContainer}>
                                    <p style={{ color: `${colors[inventory?.weapon?.rarity]?.hex}` }}>{inventory?.weapon?.rarity.toUpperCase()}</p>
                                    <h3>{inventory?.weapon?.name.toUpperCase()}</h3>
                                </div>
                                </>
                            ) : (
                                <div className={styles.equippedWeaponInfoContainer}>
                                    <p>Weapon</p>
                                    <h3>None</h3>
                                </div>
                            )}
                            
                        </div>
                        <div className={`${styles.weaponSlot}`} style={{ background: `linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent)`, borderLeft: `3px solid #808080` }}>
                            <div className={styles.equippedWeaponInfoContainer}>
                                <p>Armor</p>
                                <h3>None</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.inventory}>
                    <h3>INVENTORY</h3>
                    <div className={styles.inventoryInner}>
                        <div id="misc-grid" className={styles.miscGrid}>
                            {inventory?.misc.map((slot, i) => (
                                <div key={i} id={`misc-slot-${i}`}  className={`${styles.slot} ${slot ? styles[slot.rarity] : ""} ${selected === i+1 ? styles.selected : ""}`} onClick={() => {openItemPanel(slot); setSelected(i+1);}}>
                                    {slot && <img src={slot.icon} className={styles.slotImg} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div id="item-info-panel" className={itemPanelOpen ? `${styles.itemInfoPanel} ${styles.open}` : styles.itemInfoPanel}>
                    <div className={styles.itemIconContainer}>
                        {selectedItem && (
                            <>
                                <img src={selectedItem.icon} className={selectedItem.type === "pistol" && "stats" in selectedItem ? styles.selectedPistolImg : styles.selectedOtherImg} />
                                <div className={styles.bgLight} style={{ background: `${colors[selectedItem.rarity]?.hex}` }}></div>
                            </>
                        )}
                    </div>
                    <div className={styles.itemInfoContainer}>
                        {selectedItem && (
                        <div className={styles.nameContainer}>
                            <div className={styles.header}>
                                <p><img src={powerIconImg.src}/> {selectedItem.stats.power}</p>
                                <p>|</p>
                                <p className={styles[`${selectedItem.rarity}`]}>{selectedItem.rarity.toUpperCase()}</p>
                            </div>
                            <h3 className={styles.itemName}>{selectedItem.name.toUpperCase()}</h3>
                            <div className={styles.weaponTypeContainer}>
                                <p className={styles.weaponTypeName}>{selectedItem.type}</p>
                                <p className={styles.attackStyleName}>{selectedItem.attackStyle}</p>
                            </div>
                            <div className={styles.itemStatsContainer}>
                                <div className={styles.damageContainer}>
                                    <img src={damageIconImg.src} />
                                    <p>{selectedItem.stats.damage} Damage</p>
                                </div>
                            </div>
                        </div>
                        )}
                        <div className={styles.itemDescContainer}>
                            <div id="item-info-text">
                                <h1 id="item-info-name"></h1>
                                <p id="item-info-type"></p>
                            </div>
                            <p id="item-info-description"></p>
                            <div id="item-info-stats"></div>
                            {selectedItem && (
                                <div id="button-container" className={styles.equipBtnContainer}>
                                    {selectedItem !== inventory?.weapon ? (
                                        <button id="equip-btn" className={styles.equipBtn} onClick={() => {
                                            inventory?.equipWeapon(selectedItem, engine, selected-1)
                                            setItemPanelOpen(false);
                                            setSelected(0);
                                        }}>EQUIP</button>
                                    ) : (
                                        <button id="equip-btn" className={styles.unequipBtn} onClick={() => {
                                            inventory?.unequipWeapon(selectedItem, engine)
                                            setItemPanelOpen(false);
                                            setSelectedItem(null);
                                            setSelected(-1);
                                        }}>UNEQUIP</button>
                                    )}
                                    
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
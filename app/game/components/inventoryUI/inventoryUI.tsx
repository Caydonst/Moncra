import styles from "./inventory.module.css"
import { Inventory } from "../../inventory/inventory"
import {Ammunition, Item, Weapon} from "../../items/ItemTypes";
import React, { useEffect, useState } from "react";
import type { GameScene } from "../../scenes/GameScene";
import {XMarkIcon} from "@heroicons/react/24/solid"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import { equippableItems } from "../../items/ItemTypes";
import { Armor } from "../../armor/armor";
import { colors } from "../../utils/uiUtils"

type Props = {
    inventoryOpen: boolean;
    setInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    inventory: Inventory | null;
    itemPanelOpen: boolean;
    setItemPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedItem: Weapon | Armor | null;
    setSelectedItem: React.Dispatch<React.SetStateAction<Weapon | Armor | null>>;
    engine: ex.Engine | null;
}

export default function InventoryUI({ inventoryOpen, setInventoryOpen, inventory, itemPanelOpen, setItemPanelOpen, selectedItem, setSelectedItem, engine }: Props) {
    const [selected, setSelected] = useState<number>(-1);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

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

    const filteredItems = (() => {
        const matchingItems =
            inventory?.misc
                .map((item, realIndex) => ({ item, realIndex }))
                .filter(({ item }) => {
                    if (!item) return false;

                    if (selectedFilter === "all") return true;

                    if (selectedFilter === "weapons") {
                        return item.type === "Great Sword" || item.type === "Bow";
                    }

                    if (selectedFilter === "armor") {
                        return item.type === "Armor";
                    }

                    return true;
                }) ?? [];

        const emptySlots = Array(24 - matchingItems.length)
            .fill(null)
            .map(() => ({
                item: null,
                realIndex: -1,
            }));

        return [...matchingItems, ...emptySlots];
    })();

    return (
        <div id="inventory-wrapper" className={inventoryOpen ? `${styles.inventoryWrapper} ${styles.open}` : styles.inventoryWrapper} onClick={(e) => e.stopPropagation()}>
            <div id="inventory" className={styles.inventoryContainer}>
                <h3 className={styles.wrapperh3}>INVENTORY</h3>
                
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
                                borderColor: `${
                                    colors[inventory?.weapon?.rarity]?.hex ?? "#606060"
                                }`
                            }} 
                            onClick={() => {
                                openItemPanel(inventory?.weapon); 
                                setSelected(0);
                            }}>
                            
                            {inventory?.weapon ? (
                                <>
                                <div className={styles.gearSlotIconContainer}>
                                    <img src={inventory.weapon.icon} className={styles.gearImg} />
                                </div>
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


                        <div 
                            className={
                                `${styles.weaponSlot} ${selected === 1 ? styles.selected : ""}`
                            } 
                            style={{
                                background: `linear-gradient(
                                    to right,
                                    ${colors[inventory?.armor?.rarity]?.rgba ?? "rgba(255,255,255,0.1)"},
                                    transparent
                                )`,
                                borderColor: `${
                                    colors[inventory?.armor?.rarity]?.hex ?? "#606060"
                                }`
                            }} 
                            onClick={() => {
                                openItemPanel(inventory?.armor); 
                                setSelected(1);
                            }}>
                            
                            {inventory?.armor ? (
                                <>
                                <div className={styles.gearSlotIconContainer}>
                                    <img src={inventory.armor?.icon} className={styles.gearImg} />
                                </div>
                                <div className={styles.equippedWeaponInfoContainer}>
                                    <p style={{ color: `${colors[inventory?.armor?.rarity]?.hex}` }}>{inventory?.armor?.rarity.toUpperCase()}</p>
                                    <h3>{inventory?.armor?.name.toUpperCase()}</h3>
                                </div>
                                </>
                            ) : (
                                <div className={styles.equippedWeaponInfoContainer}>
                                    <p>Armor</p>
                                    <h3>None</h3>
                                </div>
                            )}
                            
                        </div>
                    </div>
                </div>
                <div className={styles.inventory}>
                    <div className={styles.itemFilterContainer}>
                        <button 
                            onClick={() => setSelectedFilter("all")} className={`${styles.filterBtn} ${selectedFilter === "all" ? styles.filterSelected : ""}`}
                            onMouseEnter={() => setHoveredFilter("all")}
                            onMouseLeave={() => setHoveredFilter(null)}
                        >
                            All<img src={
                                selectedFilter === "all" || hoveredFilter === "all"
                                        ? allIconSelected.src
                                        : allIcon.src
                                    } 
                                />
                        </button>
                        <button 
                            onClick={() => setSelectedFilter("weapons")} className={`${styles.filterBtn} ${selectedFilter === "weapons" ? styles.filterSelected : ""}`}
                            onMouseEnter={() => setHoveredFilter("weapons")}
                            onMouseLeave={() => setHoveredFilter(null)}
                        >
                            Weapons<img src={
                                selectedFilter === "weapons" || hoveredFilter === "weapons"
                                        ? weaponIconSelected.src
                                        : weaponIcon.src
                                    } 
                                />
                        </button>
                        <button 
                            onClick={() => setSelectedFilter("armor")} className={`${styles.filterBtn} ${selectedFilter === "armor" ? styles.filterSelected : ""}`}
                            onMouseEnter={() => setHoveredFilter("armor")}
                            onMouseLeave={() => setHoveredFilter(null)}
                        >
                            Armor<img src={
                                selectedFilter === "armor" || hoveredFilter === "armor"
                                        ? armorIconSelected.src
                                        : armorIcon.src
                                    } 
                                />
                        </button>
                    </div>
                    <div className={styles.inventoryInner}>
                        <div id="misc-grid" className={styles.miscGrid}>
                            {filteredItems.map(({ item: slot, realIndex }, displayIndex) => (
                                <div
                                    key={displayIndex}
                                    id={`misc-slot-${displayIndex}`}
                                    className={`${styles.slot} ${slot ? styles[slot.rarity] : ""} ${
                                        slot && selected === realIndex + 2 ? styles.selected : ""
                                    }`}
                                    onClick={() => {
                                        if (!slot) return;

                                        openItemPanel(slot);
                                        setSelected(realIndex + 2);
                                    }}
                                >
                                    {slot?.icon && (
                                        <img src={slot.icon} className={styles.slotImg} />
                                    )}
                                    {slot?.level !== undefined && (
                                        <p className={styles.weaponLevel} style={{ color: `${slot?.level === 10 ? "#FFE500" : "#fff"}` }}>+{slot?.level}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.bottomShadowContainer}></div>
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
                    {selectedItem && (
                        <div className={styles.itemInfoContainer}>
                        <div className={styles.nameContainer}>
                            <div className={styles.header}>
                                <p><img src={powerIconImg.src}/> {selectedItem.stats.power}</p>
                                <p>|</p>
                                <p className={styles[`${selectedItem.rarity}`]}>{selectedItem.rarity.toUpperCase()}</p>
                            </div>
                            <h3 className={styles.itemName}>{selectedItem.name.toUpperCase()}</h3>
                            <div className={styles.weaponTypeContainer}>
                                <p className={styles.weaponTypeName}>{selectedItem.type}</p>
                                {selectedItem.attackStyle && (
                                    <p className={styles.attackStyleName}>{selectedItem.attackStyle}</p>
                                )}
                            </div>
                            {selectedItem?.level !== undefined && (
                                <>
                                    <p className={styles.selectedWeaponLevel} style={{ color: `${selectedItem?.level === 10 ? "#FFE500" : "#fff"}` }}>Level +{selectedItem?.level}</p>
                                </>
                            )}
                            <div className={styles.itemStatsContainer}>
                                {selectedItem.stats.damage && (
                                    <div className={styles.statContainer}>
                                        <div className={styles.statIconContainer}><img src={damageIcon.src} className={styles.damageIcon} /></div>
                                        <p>{selectedItem.stats.damage} Damage</p>
                                    </div>
                                )}
                                {selectedItem.stats.hp && (
                                    <div className={styles.statContainer}>
                                        <div className={styles.statIconContainer}><img src={hpIcon.src} className={styles.hpIcon} /></div>
                                        <p>{selectedItem.stats.hp} HP</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className={styles.enchantmentsContainer}>
                            <p>Enchantments</p>
                            {selectedItem.enchantments ? (
                                <div className={styles.enchantments}>
                                    {selectedItem.enchantments.map(enchantment => (
                                        <div key={enchantment.id} className={styles.enchantment}>
                                            <div className={styles.enchantmentIconContainer}></div>
                                            <p className={styles.enchantmentName}>{enchantment.name}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>None</p>
                            )}
                            
                        </div>
                        <div className={styles.itemDescContainer}>
                            <div id="item-info-text">
                                <h1 id="item-info-name"></h1>
                                <p id="item-info-type"></p>
                            </div>
                            <p id="item-info-description"></p>
                            <div id="item-info-stats"></div>
                            {equippableItems.includes(selectedItem.type) && (
                                <div id="button-container" className={styles.equipBtnContainer}>
                                    {selectedItem !== inventory?.weapon && selectedItem !== inventory?.armor ? (
                                        <button id="equip-btn" className={styles.equipBtn} onClick={() => {
                                            inventory?.equip(selectedItem, engine, selected-2)
                                            setItemPanelOpen(false);
                                            setSelected(-1);
                                        }}>EQUIP</button>
                                    ) : (
                                        <button id="equip-btn" className={styles.unequipBtn} onClick={() => {
                                            inventory?.unequip(selectedItem, engine)
                                            setItemPanelOpen(false);
                                            setSelectedItem(null);
                                            setSelected(-1);
                                        }}>UNEQUIP</button>
                                    )}
                                    
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}
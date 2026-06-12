import { useState } from "react";
import styles from "./blacksmith.module.css"
import { Item, Weapon } from "../../items/ItemTypes";
import { Inventory } from "../../inventory/inventory";
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import goldIcon from "@/app/game/assets/currency/gold_icon.png"
import { colors } from "../../utils/uiUtils"
import { Armor } from "../../armor/armor";
import { upgrade } from "./helperFunctions"
import { getUpgradeCost } from "../../items/UpgradeCosts";

type Props = {
    blacksmithOpen: boolean;
    inventory: Inventory;
}

export default function Upgrading({ blacksmithOpen, inventory }: Props) {
    const [selectedItem, setSelectedItem] = useState<Weapon | Armor | null>(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
    const [realItemIndex, setRealItemIndex] = useState(-1);
    const [itemPanelOpen, setItemPanelOpen] = useState(false);
    const [miscItems, setMiscItems] = useState<(Item | Weapon | null)[]>(
        inventory?.misc ?? Array(24).fill(null)
    );
    const [inventorySelected, setInventorySelected] = useState<number>(-1);
    const [storageSelected, setStorageSelected] = useState<number>(-1);

    const [inventoryFilter, setInventoryFilter] = useState("all");
    const [storageFilter, setStorageFilter] = useState("all");

    const [hoveredInventoryFilter, setHoveredInventoryFilter] = useState<string | null>(null);
    const [hoveredStorageFilter, setHoveredStorageFilter] = useState<string | null>(null);

    function itemMatchesFilter(item: Item | Weapon | null, filter: string) {
        if (!item) return false;

        if (filter === "all") return true;

        if (filter === "weapons") {
            return item.type === "Great Sword" || item.type === "Bow";
        }

        if (filter === "armor") {
            return item.type === "Armor";
        }

        return true;
    }

    const filteredInventoryItems = (() => {
        const allItems = [inventory.weapon, inventory.armor, ...inventory.misc]
        const matchingItems = allItems
            .map((item, realIndex) => ({ item, realIndex }))
            .filter(({ item }) => itemMatchesFilter(item, inventoryFilter));

        return [...matchingItems];
    })();

    function upgradeItem() {
        if (!selectedItem) return;

        const upgradedItem = upgrade(selectedItem);
        if (!upgradedItem) return;

        setSelectedItem(upgradedItem);
        //filteredInventoryItems[selectedItemIndex] = upgradedItem;
        
        if (selectedItem === inventory.weapon) {
            inventory.weapon = upgradedItem as Weapon;
        } else if (selectedItem === inventory.armor) {
            inventory.armor = upgradedItem as Armor;
        } else {
            inventory.misc[realItemIndex - 2] = upgradedItem;
        }
        

        //filteredInventoryItems[selectedItemIndex] = upgradedItem;
    }

    return (
        <div className={styles.evolvingContainer}>
            <div className={styles.inventory}>
                <div className={styles.itemFilterContainer}>
                    <button 
                        onClick={() => setInventoryFilter("all")} className={`${styles.filterBtn} ${inventoryFilter === "all" ? styles.filterSelected : ""}`}
                        onMouseEnter={() => setHoveredInventoryFilter("all")}
                        onMouseLeave={() => setHoveredInventoryFilter(null)}
                    >
                        All<img src={
                            inventoryFilter === "all" || hoveredInventoryFilter === "all"
                                    ? allIconSelected.src
                                    : allIcon.src
                                } 
                            />
                    </button>
                    <button 
                        onClick={() => setInventoryFilter("weapons")} className={`${styles.filterBtn} ${inventoryFilter === "weapons" ? styles.filterSelected : ""}`}
                        onMouseEnter={() => setHoveredInventoryFilter("weapons")}
                        onMouseLeave={() => setHoveredInventoryFilter(null)}
                    >
                        Weapons<img src={
                            inventoryFilter === "weapons" || hoveredInventoryFilter === "weapons"
                                    ? weaponIconSelected.src
                                    : weaponIcon.src
                                } 
                            />
                    </button>
                    <button 
                        onClick={() => setInventoryFilter("armor")} className={`${styles.filterBtn} ${inventoryFilter === "armor" ? styles.filterSelected : ""}`}
                        onMouseEnter={() => setHoveredInventoryFilter("armor")}
                        onMouseLeave={() => setHoveredInventoryFilter(null)}
                    >
                        Armor<img src={
                            inventoryFilter === "armor" || hoveredInventoryFilter === "armor"
                                    ? armorIconSelected.src
                                    : armorIcon.src
                                } 
                            />
                    </button>
                </div>
                <div className={styles.inventoryInner}>
                    <div id="misc-grid" className={styles.miscGrid}>
                        {filteredInventoryItems.map(({ item: slot, realIndex }, displayIndex) => (
                            <div
                                key={displayIndex}
                                className={`${styles.slot} ${
                                    slot && selectedItemIndex === displayIndex ? styles.selected : ""
                                }`}
                                onClick={() => {
                                    if (!slot) return;
                                    setSelectedItem(slot);
                                    setSelectedItemIndex(displayIndex)
                                    setRealItemIndex(realIndex)
                                }}
                                style={{ 
                                    background: `linear-gradient(
                                            to right,
                                            ${colors[slot?.rarity]?.rgba ?? "rgba(255,255,255,0.1)"},
                                            transparent
                                        )`,
                                    borderColor: `${colors[slot?.rarity]?.hex}` }}
                            >
                                {slot?.icon && (
                                    <div className={styles.miscSlotIconContainer}>
                                        <img src={slot.icon} className={styles.slotImg} />
                                    </div>
                                )}
                                <div className={styles.miscItemNameContainer}>
                                    <p style={{ color: `${colors[slot?.rarity]?.hex}` }}>{slot?.rarity.toUpperCase()}</p>
                                    <p>{slot?.name.toUpperCase()}</p>
                                </div>
                                {slot?.level !== undefined && (
                                    <p className={styles.weaponLevel} style={{ color: `${slot?.level === 10 ? "#FFE500" : "#fff"}` }}>+{slot?.level}</p>
                                )}
                            </div>
                            
                        ))}
                    </div>
                </div>
                <div className={styles.bottomShadowContainer}></div>
            </div>
            <div className={styles.selectedItemContainer}>
                {selectedItem !== null ? (
                    <>
                    <div className={styles.upgradingInfoContainer}>
                        <div className={styles.itemIconContainer}>
                            <img src={selectedItem?.icon} />
                            {selectedItem?.rarity !== undefined && (
                                <div className={styles.bgLight} style={{ background: `${colors[selectedItem?.rarity]?.hex}` }}></div>
                            )}
                        </div>
                        <div className={styles.nameContainer}>
                            <h3>{selectedItem?.name.toUpperCase()}</h3>
                            <p style={{ color: `${colors[selectedItem?.rarity]?.hex}` }}>{selectedItem?.rarity.toUpperCase()}</p>
                        </div>
                    </div>
                    <div className={styles.statsDisplayContainer}>
                        {selectedItem.level < selectedItem.maxLevel ? (
                            <>
                            <div className={styles.currentLevelContainer}>
                                {selectedItem?.level !== undefined && (
                                    <p className={styles.level}>Level +{selectedItem.level}</p>
                                )}
                                <p className={styles.stats}>Damage: {selectedItem?.stats.damage}</p>
                            </div>
                            <p>{"-->"}</p>
                            <div className={styles.nextLevelContainer}>
                                {selectedItem?.level !== undefined && (
                                    <p className={styles.level}>Level +{selectedItem.level + 1}</p>
                                )}
                                <div className={styles.damageIncreaseContainer}>
                                    <p className={styles.stats}>Damage: {selectedItem?.stats.damage + 2}</p>
                                    <p className={styles.stats}>(+2)</p>
                                </div>
                            </div>
                            </>
                        ) : (
                            <div className={styles.maxLevelContainer}>
                                <p>Level 10</p>
                                <h3>MAX LEVEL</h3>
                            </div>
                        )}
                    </div>
                    {selectedItem.level < selectedItem.maxLevel && (
                        <>
                        <div className={styles.materialsContainer}>
                            <div className={styles.material}>
                                <div className={styles.materialIcon}>
                                    <div className={styles.materialBgLight}></div>
                                    <img src={goldIcon.src} />
                                </div>
                                <p>2354 / {getUpgradeCost(selectedItem).gold}</p>
                            </div>
                            {getUpgradeCost(selectedItem).materials.map((material, index) => (
                                <div key={index} className={styles.material}>
                                    <div className={styles.materialIcon}>
                                        <div className={styles.materialBgLight} style={{ background: `${colors[material.material.rarity].hex}` }}></div>
                                        <img src={material.material.icon} style={{ filter: `drop-shadow(0 0 3px ${colors[material.material.rarity].hex})` }} />
                                    </div>
                                    <p>23 / {material.quantity}</p>
                                </div>
                            ))}
                        </div>
                        <button className={styles.upgradeBtn} onClick={upgradeItem}>UPGRADE</button>
                        </>
                    )}
                    </>
                    
                ) : (
                    <div>No item selected</div>
                )}
                
                
            </div>
        </div>
    )
}
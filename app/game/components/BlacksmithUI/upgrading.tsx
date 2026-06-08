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

type Props = {
    blacksmithOpen: boolean;
    inventory: Inventory;
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

export default function Upgrading({ blacksmithOpen, inventory }: Props) {
    const [selectedItem, setSelectedItem] = useState(-1);
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
        const matchingItems = miscItems
            .map((item, realIndex) => ({ item, realIndex }))
            .filter(({ item }) => itemMatchesFilter(item, inventoryFilter));

        const emptySlots = Array(24 - matchingItems.length)
            .fill(null)
            .map(() => ({
                item: null,
                realIndex: -1,
            }));

        return [...matchingItems, ...emptySlots];
    })();

    return (
        <div className={styles.evolvingContainer}>
            <div className={styles.inventory}>
                <h3>INVENTORY</h3>
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
                                className={`${styles.slot} ${slot ? styles[slot.rarity] : ""} ${
                                    slot && selectedItem === realIndex ? styles.selected : ""
                                }`}
                                onClick={() => {
                                    if (!slot) return;
                                    setSelectedItem(realIndex);
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
            <div className={styles.selectedItemContainer}>
                <div className={styles.upgradingInfoContainer}>
                    <div className={styles.itemIconContainer}>
                        <img src={miscItems[selectedItem]?.icon} />
                        {miscItems[selectedItem]?.rarity !== undefined && (
                            <div className={styles.bgLight} style={{ background: `${colors[miscItems[selectedItem].rarity]?.hex}` }}></div>
                        )}
                    </div>
                    <div className={styles.nameContainer}>
                        <p>{miscItems[selectedItem]?.name}</p>
                    <p style={{ color: `${colors[miscItems[selectedItem]?.rarity]?.hex}` }}>{miscItems[selectedItem]?.rarity.toUpperCase()}</p>
                    </div>
                </div>
                <div className={styles.statsDisplayContainer}>
                    <div className={styles.currentLevelContainer}>
                        {miscItems[selectedItem]?.level !== undefined && (
                            <p className={styles.level}>Level +{miscItems[selectedItem].level}</p>
                        )}
                        <p className={styles.stats}>Damage: {miscItems[selectedItem]?.stats.damage}</p>
                    </div>
                    <p>{"-->"}</p>
                    <div className={styles.nextLevelContainer}>
                        {miscItems[selectedItem]?.level !== undefined && (
                            <p className={styles.level}>Level +{miscItems[selectedItem].level + 1}</p>
                        )}
                        <div className={styles.damageIncreaseContainer}>
                            <p className={styles.stats}>Damage: {miscItems[selectedItem]?.stats.damage + 2}</p>
                            <p className={styles.stats}>(+2)</p>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    )
}
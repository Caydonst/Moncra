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

export default function Evolving({ blacksmithOpen, inventory }: Props) {
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
                    <div></div>
                    <div></div>
                </div>
                <div></div>
            </div>
        </div>
    )
}
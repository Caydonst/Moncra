import { useEffect, useState } from "react";
import styles from "./storage.module.css"
import { Inventory } from "../../inventory/inventory";
import { Item, Weapon } from "../../items/ItemTypes";
import { StorageChest } from "../../HubSystems/StorageChest";
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import { colors } from "../../utils/uiUtils"

type Props = {
    storageOpen: boolean;
    storagePanelOpen: boolean;
    inventory: Inventory | null;
    storageItems: (Item | Weapon | null)[];
    storage: StorageChest | null;
}

export default function StorageUI({ storageOpen, inventory, storage }: Props) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemPanelOpen, setItemPanelOpen] = useState(false);
    const [storageItems, setStorageItems] = useState<(Item | Weapon | null)[]>(storage?.getItems() ?? Array(36).fill(null));
    const [miscItems, setMiscItems] = useState<(Item | Weapon | null)[]>(
        inventory?.misc ?? Array(24).fill(null)
    );
    const [inventorySelected, setInventorySelected] = useState<number>(-1);
    const [storageSelected, setStorageSelected] = useState<number>(-1);

    const [inventoryFilter, setInventoryFilter] = useState("all");
    const [storageFilter, setStorageFilter] = useState("all");

    const [hoveredInventoryFilter, setHoveredInventoryFilter] = useState<string | null>(null);
    const [hoveredStorageFilter, setHoveredStorageFilter] = useState<string | null>(null);

    useEffect(() => {
        if (!storage) return;

        setStorageItems([...storage.getItems()]);
    }, [storage]);

    useEffect(() => {
    if (!inventory) return;

    setMiscItems([...inventory.misc]);
}, [inventory]);

    useEffect(() => {
        if (!storageOpen) {
            setSelectedItem(null);
            setInventorySelected(-1);
            setStorageSelected(-1);
            setItemPanelOpen(false);
        }
        setMiscItems([...inventory.misc]);
    }, [storageOpen])

    function openItemPanel(slot: any) {
        setSelectedItem(slot);
        if (slot) {
            setItemPanelOpen(true);
        }
    }

    function transferToStorage(item: Item | Weapon | null) {
        if (!item || !storage || !inventory) return;

        storage?.addItem(item);
        inventory?.removeItem(item);
        setStorageItems([...storage.getItems()]);
        setMiscItems([...inventory.misc]);
    }

    function transferToInventory(item: Item | Weapon | null) {
        if (!item || !storage || !inventory) return;

        inventory.addItem(item);
        storage.removeItem(item);

        setStorageItems([...storage.getItems()]);
        setMiscItems([...inventory.misc]);
    }

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

    const filteredStorageItems = (() => {
        const matchingItems = storageItems
            .map((item, realIndex) => ({ item, realIndex }))
            .filter(({ item }) => itemMatchesFilter(item, storageFilter));

        const emptySlots = Array(36 - matchingItems.length)
            .fill(null)
            .map(() => ({
                item: null,
                realIndex: -1,
            }));

        return [...matchingItems, ...emptySlots];
    })();

    return (
        <div className={`${styles.storageWrapper} ${storageOpen ? styles.open : ""}`}>
            <div className={`${styles.storageContainer} ${storageOpen ? styles.open : ""}`}>
                <div className={styles.storageInner}>
                    <div className={styles.storage}>
                        <h3>STORAGE CHEST</h3>
                        <div className={styles.itemFilterContainer}>
                            <button 
                                onClick={() => setStorageFilter("all")} className={`${styles.filterBtn} ${storageFilter === "all" ? styles.filterSelected : ""}`}
                                onMouseEnter={() => setHoveredStorageFilter("all")}
                                onMouseLeave={() => setHoveredStorageFilter(null)}
                            >
                                All<img src={
                                    storageFilter === "all" || hoveredStorageFilter === "all"
                                            ? allIconSelected.src
                                            : allIcon.src
                                        } 
                                    />
                            </button>
                            <button 
                                onClick={() => setStorageFilter("weapons")} className={`${styles.filterBtn} ${storageFilter === "weapons" ? styles.filterSelected : ""}`}
                                onMouseEnter={() => setHoveredStorageFilter("weapons")}
                                onMouseLeave={() => setHoveredStorageFilter(null)}
                            >
                                Weapons<img src={
                                    storageFilter === "weapons" || hoveredStorageFilter === "weapons"
                                            ? weaponIconSelected.src
                                            : weaponIcon.src
                                        } 
                                    />
                            </button>
                            <button 
                                onClick={() => setStorageFilter("armor")} className={`${styles.filterBtn} ${storageFilter === "armor" ? styles.filterSelected : ""}`}
                                onMouseEnter={() => setHoveredStorageFilter("armor")}
                                onMouseLeave={() => setHoveredStorageFilter(null)}
                            >
                                Armor<img src={
                                    storageFilter === "armor" || hoveredStorageFilter === "armor"
                                            ? armorIconSelected.src
                                            : armorIcon.src
                                        } 
                                    />
                            </button>
                        </div>
                        <div className={styles.inventoryInner}>
                            <div className={styles.miscGrid}>
                                {filteredStorageItems.map(({ item: slot, realIndex }, displayIndex) => (
                                    <div
                                        key={displayIndex}
                                        className={`${styles.slot} ${slot ? styles[slot.rarity] : ""} ${
                                            slot && storageSelected === realIndex ? styles.selected : ""
                                        }`}
                                        onClick={() => {
                                            if (!slot) return;

                                            openItemPanel(slot);
                                            setStorageSelected(realIndex);
                                            setInventorySelected(-1);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (!slot) return;

                                            transferToInventory(slot);
                                            setSelectedItem(null);
                                            setItemPanelOpen(false);
                                            setStorageSelected(-1);
                                            setInventorySelected(-1);
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
                                            slot && inventorySelected === realIndex ? styles.selected : ""
                                        }`}
                                        onClick={() => {
                                            if (!slot) return;

                                            openItemPanel(slot);
                                            setInventorySelected(realIndex);
                                            setStorageSelected(-1);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (!slot) return;

                                            transferToStorage(slot);
                                            setSelectedItem(null);
                                            setItemPanelOpen(false);
                                            setInventorySelected(-1);
                                            setStorageSelected(-1);
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
                    <div className={itemPanelOpen ? `${styles.itemInfoPanel} ${styles.open}` : styles.itemInfoPanel}>
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
                            )}
                            <div className={styles.itemDescContainer}>
                                <div id="item-info-text">
                                    <h1 id="item-info-name"></h1>
                                    <p id="item-info-type"></p>
                                </div>
                                <p id="item-info-description"></p>
                                <div id="item-info-stats"></div>
                                {inventorySelected >= 0 ? (
                                    <button
                                        className={styles.equipBtn}
                                        onClick={() => {
                                            transferToStorage(selectedItem);
                                            setSelectedItem(null);
                                            setItemPanelOpen(false);
                                            setInventorySelected(-1);
                                        }}
                                    >
                                        TRANSFER TO STORAGE
                                    </button>
                                ) : (
                                    <button
                                        className={styles.equipBtn}
                                        onClick={() => {
                                            transferToInventory(selectedItem);
                                            setSelectedItem(null);
                                            setItemPanelOpen(false);
                                            setStorageSelected(-1);
                                        }}
                                    >
                                        TRANSFER TO INVENTORY
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                
    )
}
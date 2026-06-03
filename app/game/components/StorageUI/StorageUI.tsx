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

type Props = {
    storageOpen: boolean;
    storagePanelOpen: boolean;
    inventory: Inventory | null;
    storageItems: (Item | Weapon | null)[];
    storage: StorageChest | null;
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

export default function StorageUI({ storageOpen, inventory, storage }: Props) {
    const [inventorySelected, setInventorySelected] = useState<number>(-1);
    const [storageSelected, setStorageSelected] = useState<number>(-1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemPanelOpen, setItemPanelOpen] = useState(false);
    const [storageItems, setStorageItems] = useState<(Item | Weapon | null)[]>(storage?.getItems() ?? Array(36).fill(null));
    const [miscItems, setMiscItems] = useState<(Item | Weapon | null)[]>(
        inventory?.misc ?? Array(24).fill(null)
    );
    const [selected, setSelected] = useState<number>(-1);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

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

    console.log(storageItems);

    const filteredItems = (() => {
        const matchingItems = miscItems
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
            });

        const emptySlots = Array(24 - matchingItems.length)
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
                        <div className={styles.inventoryInner}>
                            <div className={styles.miscGrid}>
                                {storageItems && (
                                    storageItems.map((slot, i) => (
                                        <div key={i} className={`${styles.slot} ${slot ? styles[slot.rarity] : ""} ${storageSelected === i+1 ? styles.selected : ""}`} onClick={() => {openItemPanel(slot); setStorageSelected(i+1); setInventorySelected(-1);}} onContextMenu={(e) => {e.preventDefault(); transferToInventory(slot);}}>
                                            {slot && <img src={slot.icon} className={styles.slotImg} />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className={styles.bottomShadowContainer}></div>
                    </div>
                    <div className={styles.inventory}>
                        <h3>INVENTORY</h3>
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
                                            setSelected(-1);
                                        }}
                                    >
                                        {slot && <img src={slot.icon} className={styles.slotImg} />}
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
                                {selectedItem && (
                                    inventorySelected >= 0 ? (
                                        <button
                                            className={styles.equipBtn}
                                            onClick={() => {
                                                transferToStorage(selectedItem);
                                                setSelectedItem(null);
                                                setItemPanelOpen(false);
                                                setInventorySelected(-1);
                                                setSelected(-1);
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
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                
    )
}
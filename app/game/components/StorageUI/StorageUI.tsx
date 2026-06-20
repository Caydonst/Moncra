import { useEffect, useState } from "react";
import styles from "./storage.module.css"
import { Inventory } from "../../inventory/inventory";
import { Item, Material, Weapon } from "../../items/ItemTypes";
import { StorageChest } from "../../HubSystems/StorageChest";
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import materialIcon from "@/app/game/assets/icons/material_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import materialIconSelected from "@/app/game/assets/icons/material_icon_selected.png"
import { equippableItems } from "../../items/ItemTypes";
import { colors } from "../../utils/uiUtils"
import { Armor } from "../../armor/armor";

type Props = {
    storageOpen: boolean;
    storagePanelOpen: boolean;
    inventory: Inventory | null;
    storageItems: (Item | Weapon | null)[];
    storage: StorageChest | null;
}

type Filter = "all" | "weapons" | "armor" | "material";
type InventoryItem = Material | Weapon | Armor;

type SelectedSlot = {
    side: "inventory" | "storage" | null;
    itemId: string | null;
};

type DisplayItem = {
    item: InventoryItem | null;
    realIndex: number;
    source: "weapon" | "armor" | "material" | "empty";
};

export default function StorageUI({ storageOpen, inventory, storage }: Props) {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>({
        side: null,
        itemId: null,
    });

    const [itemPanelOpen, setItemPanelOpen] = useState(false);

    const [inventoryFilter, setInventoryFilter] = useState<Filter>("all");
    const [storageFilter, setStorageFilter] = useState<Filter>("all");

    const [hoveredInventoryFilter, setHoveredInventoryFilter] = useState<string | null>(null);
    const [hoveredStorageFilter, setHoveredStorageFilter] = useState<string | null>(null);

    useEffect(() => {
        if (!storageOpen) {
            setSelectedItem(null);
            setSelectedSlot({ side: null, itemId: null });
            setItemPanelOpen(false);
        }
    }, [storageOpen]);

    function openItemPanel(slot: any) {
        setSelectedItem(slot);
        if (slot) {
            setItemPanelOpen(true);
        }
    }

    function transferToStorage(item: InventoryItem | null) {
        if (!item || !storage || !inventory) return;

        storage.addItem(item);
        inventory.removeItem(item);

        setSelectedItem(item);
        setItemPanelOpen(true);
        setSelectedSlot({
            side: "storage",
            itemId: item.id,
        });
    }

    function transferToInventory(item: InventoryItem | null) {
        if (!item || !storage || !inventory) return;

        inventory.addItem(item);
        storage.removeItem(item);

        setSelectedItem(item);
        setItemPanelOpen(true);
        setSelectedSlot({
            side: "inventory",
            itemId: item.id,
        });
    }

    function getFilteredItems(container: Inventory | StorageChest | null, filter: Filter): DisplayItem[] {
        if (!container) return [];

        let sourceItems: DisplayItem[] = [];

        switch (filter) {
            case "weapons":
                sourceItems = container.miscWeapons.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "weapon",
                }));
                break;

            case "armor":
                sourceItems = container.miscArmor.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "armor",
                }));
                break;

            case "material":
                sourceItems = container.miscMaterial.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "material",
                }));
                break;

            default:
                sourceItems = [
                    ...container.miscWeapons.map((item, realIndex) => ({
                        item,
                        realIndex,
                        source: "weapon" as const,
                    })),
                    ...container.miscArmor.map((item, realIndex) => ({
                        item,
                        realIndex,
                        source: "armor" as const,
                    })),
                    ...container.miscMaterial.map((item, realIndex) => ({
                        item,
                        realIndex,
                        source: "material" as const,
                    })),
                ];
        }

        const filledSlots = sourceItems.filter(({ item }) => item !== null);
        const targetSlotCount = filter === "all" ? 36 : 12;
        const emptyCount = Math.max(0, targetSlotCount - filledSlots.length);

        const emptySlots: DisplayItem[] = Array(emptyCount)
            .fill(null)
            .map(() => ({
                item: null,
                realIndex: -1,
                source: "empty",
            }));

        return [...filledSlots, ...emptySlots];
    }

    const filteredStorageItems = getFilteredItems(storage, storageFilter);
    const filteredInventoryItems = getFilteredItems(inventory, inventoryFilter);

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
                            <button 
                                onClick={() => setStorageFilter("material")} className={`${styles.filterBtn} ${storageFilter === "material" ? styles.filterSelected : ""}`}
                                onMouseEnter={() => setHoveredStorageFilter("material")}
                                onMouseLeave={() => setHoveredStorageFilter(null)}
                            >
                                Material<img src={
                                    storageFilter === "material" || hoveredStorageFilter === "material"
                                            ? materialIconSelected.src
                                            : materialIcon.src
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
                                            slot &&
                                            selectedSlot.side === "storage" &&
                                            selectedSlot.itemId === slot.id
                                                ? styles.selected
                                                : ""
                                        }`}
                                        onClick={() => {
                                            if (!slot) return;

                                            setSelectedItem(slot);
                                            setItemPanelOpen(true);
                                            setSelectedSlot({
                                                side: "storage",
                                                itemId: slot.id,
                                            });
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (!slot) return;

                                            transferToInventory(slot);
                                        }}
                                    >
                                        {slot?.icon && (
                                            <img src={slot.icon} className={styles.slotImg} />
                                        )}
                                        {slot?.level !== undefined && (
                                            <p className={styles.weaponLevel} style={{ color: `${slot?.level === 10 ? "#FFE500" : "#fff"}` }}>+{slot?.level}</p>
                                        )}
                                        {slot?.stats?.power !== undefined && (
                                            <p className={styles.powerLevel}><img src={powerIconImg.src} />{slot.stats.power}</p>
                                        )}
                                        {slot?.type === "Material" && (
                                            <p className={styles.quantity}>x{slot.quantity}</p>
                                        )}
                                        <div className={styles.hoverContainer}>
                                            <div className={styles.topRight}></div>
                                            <div className={styles.bottomLeft}></div>
                                            <div className={styles.topLeft}></div>
                                            <div className={styles.bottomRight}></div>
                                        </div>
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
                            <button 
                                onClick={() => setInventoryFilter("material")} className={`${styles.filterBtn} ${inventoryFilter === "material" ? styles.filterSelected : ""}`}
                                onMouseEnter={() => setHoveredInventoryFilter("material")}
                                onMouseLeave={() => setHoveredInventoryFilter(null)}
                            >
                                Material<img src={
                                    inventoryFilter === "material" || hoveredInventoryFilter === "material"
                                            ? materialIconSelected.src
                                            : materialIcon.src
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
                                            slot &&
                                            selectedSlot.side === "inventory" &&
                                            selectedSlot.itemId === slot.id
                                                ? styles.selected
                                                : ""
                                        }`}
                                        onClick={() => {
                                            if (!slot) return;

                                            setSelectedItem(slot);
                                            setItemPanelOpen(true);
                                            setSelectedSlot({
                                                side: "inventory",
                                                itemId: slot.id,
                                            });
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (!slot) return;

                                            transferToStorage(slot);
                                        }}
                                    >
                                        {slot?.icon && (
                                            <img src={slot.icon} className={styles.slotImg} />
                                        )}
                                        {slot?.level !== undefined && (
                                            <p className={styles.weaponLevel} style={{ color: `${slot?.level === 10 ? "#FFE500" : "#fff"}` }}>+{slot?.level}</p>
                                        )}
                                        {slot?.stats?.power !== undefined && (
                                            <p className={styles.powerLevel}><img src={powerIconImg.src} />{slot.stats.power}</p>
                                        )}
                                        {slot?.type === "Material" && (
                                            <p className={styles.quantity}>x{slot.quantity}</p>
                                        )}
                                        <div className={styles.hoverContainer}>
                                            <div className={styles.topRight}></div>
                                            <div className={styles.bottomLeft}></div>
                                            <div className={styles.topLeft}></div>
                                            <div className={styles.bottomRight}></div>
                                        </div>
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
                    {selectedItem && (
                        <div className={styles.itemInfoContainer}>
                            <div className={styles.nameContainer}>
                            <div className={styles.header}>
                                {selectedItem.stats?.power && (
                                    <>
                                        <p className={styles.powerText}><img src={powerIconImg.src}/> {selectedItem.stats?.power}</p>
                                        <p>|</p>
                                    </>
                                )}
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
                                {selectedItem.stats?.damage && (
                                    <div className={styles.statContainer}>
                                        <div className={styles.statIconContainer}><img src={damageIcon.src} className={styles.damageIcon} /></div>
                                        <p>{selectedItem.stats?.damage} Damage</p>
                                    </div>
                                )}
                                {selectedItem.stats?.hp && (
                                    <div className={styles.statContainer}>
                                        <div className={styles.statIconContainer}><img src={hpIcon.src} className={styles.hpIcon} /></div>
                                        <p>{selectedItem.stats?.hp} HP</p>
                                    </div>
                                )}
                            </div>
                        </div>
                            {selectedItem.enchantments !== undefined && (
                                <div className={styles.enchantmentsContainer}>
                                <p>Enchantments</p>
                                {selectedItem.enchantments.length > 0 ? (
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
                            )}
                            <div id="button-container" className={styles.equipBtnContainer}>
                                {selectedSlot.side === "inventory" && (
                                    <button className={styles.equipBtn} onClick={() => transferToStorage(selectedItem)}>
                                        TRANSFER TO STORAGE
                                    </button>
                                )}

                                {selectedSlot.side === "storage" && (
                                    <button className={styles.equipBtn} onClick={() => transferToInventory(selectedItem)}>
                                        TRANSFER TO INVENTORY
                                    </button>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
                
    )
}
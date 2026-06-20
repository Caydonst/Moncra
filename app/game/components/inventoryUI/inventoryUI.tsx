import styles from "./inventory.module.css"
import { Inventory } from "../../inventory/inventory"
import {Ammunition, Item, Material, Weapon} from "../../items/ItemTypes";
import React, { useEffect, useState } from "react";
import type { GameScene } from "../../scenes/GameScene";
import {XMarkIcon} from "@heroicons/react/24/solid"
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
import goldIcon from "@/app/game/assets/currency/gold_icon.png"
import { equippableItems } from "../../items/ItemTypes";
import { Armor } from "../../armor/armor";
import { colors, specializationColors } from "../../utils/uiUtils"
import { createClientInventory } from "../../inventory/createClientInventory";
import { gameState } from "../../gameState/gameState";

type Props = {
    inventoryOpen: boolean;
    setInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    inventory: Inventory | null;
    itemPanelOpen: boolean;
    setItemPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedItem: Weapon | Armor | null;
    setSelectedItem: React.Dispatch<React.SetStateAction<Weapon | Armor | null>>;
    engine: ex.Engine | null;
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>
}

type Filter = "all" | "weapons" | "armor" | "material" | "equipment";
type SelectedSlot = {
    filter: Filter,
    displayIndex: number,
    realIndex: number,
};

export default function InventoryUI({ inventoryOpen, setInventoryOpen, inventory, setInventory, itemPanelOpen, setItemPanelOpen, selectedItem, setSelectedItem, engine }: Props) {
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>({ filter: "all", displayIndex: -1, realIndex: -1 })
    const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
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
            setSelectedFilter("all");
            setSelectedSlot({filter: "all", displayIndex: -1, realIndex: -1});
        }
    }, [inventoryOpen])

    useEffect(() => {
        console.log(selectedSlot);
    }, [selectedSlot])

    const filteredItems = (() => {
        if (!inventory) return [];

        let sourceItems = [];

        switch (selectedFilter) {
            case "weapons":
                sourceItems = inventory.miscWeapons.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "weapon" as const,
                }));
                break;

            case "armor":
                sourceItems = inventory.miscArmor.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "armor" as const,
                }));
                break;

            case "material":
                sourceItems = inventory.miscMaterial.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "material" as const,
                }));
                break;

            default:
                sourceItems = [
                    ...inventory.miscWeapons.map((item, realIndex) => ({
                        item,
                        realIndex,
                        source: "weapon" as const,
                    })),
                    ...inventory.miscArmor.map((item, realIndex) => ({
                        item,
                        realIndex,
                        source: "armor" as const,
                    })),
                    ...inventory.miscMaterial.map((item, realIndex) => ({
                        item,
                        realIndex,
                        source: "material" as const,
                    })),
                ];
        }

        const filledSlots = sourceItems.filter(({ item }) => item !== null);

        const targetSlotCount =
            selectedFilter === "all" ? 36 : 12;

        const emptySlots = Array(targetSlotCount - filledSlots.length)
            .fill(null)
            .map(() => ({
                item: null,
                realIndex: -1,
                source: "empty" as const,
            }));

        return [...filledSlots, ...emptySlots];
    })();

    const selectedIsEquipped =
    selectedItem?.type === "Weapon"
        ? !!selectedItem.uid && selectedItem.uid === inventory?.weapon?.uid
        : selectedItem?.type === "Armor"
            ? !!selectedItem.uid && selectedItem.uid === inventory?.armor?.uid
            : false;

    async function equipSelectedItem() {
        if (!inventory || !engine || !selectedItem) return null;

        const oldWeapon = inventory.weapon;
        const oldWeaponUid = oldWeapon?.uid;
        const oldWeaponInstance = oldWeapon?.instance;

        const res = await fetch("/api/equip-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: selectedItem.uid }),
        });

        const data = await res.json();
        if (!res.ok) return null;

        const clientInventory = createClientInventory(data.inventory, gameState);

        const newWeaponUid = clientInventory.weapon?.uid;
        const weaponChanged = oldWeaponUid !== newWeaponUid;

        if (weaponChanged) {
            await inventory.removeEquippedWeaponActor(engine);
        } else if (clientInventory.weapon && oldWeaponInstance) {
            clientInventory.weapon.instance = oldWeaponInstance;
        }

        gameState.inventory = clientInventory;
        setInventory(clientInventory);

        if (weaponChanged && clientInventory.weapon) {
            await clientInventory.spawnEquippedWeapon(engine);
        }

        return clientInventory;
    }
    async function unequipSelectedItem() {
        if (!inventory || !selectedItem) return;

        const slot =
            selectedItem.type === "Weapon"
                ? "weapon"
                : selectedItem.type === "Armor"
                    ? "armor"
                    : null;

        if (!slot) return;

        const res = await fetch("/api/unequip-item", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ slot }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(data.error);
            return;
        }

        if (slot === "weapon") {
            inventory.removeEquippedWeaponActor(engine);
        }

        const clientInventory = createClientInventory(data.inventory, gameState);

        gameState.inventory = clientInventory;
        setInventory(clientInventory);

        setSelectedItem(null);
        setItemPanelOpen(false);
        setSelectedSlot({
            filter: "all",
            displayIndex: -1,
            realIndex: -1,
        });
    }

    return (
        <div id="inventory-wrapper" className={inventoryOpen ? `${styles.inventoryWrapper} ${styles.open}` : styles.inventoryWrapper} onClick={(e) => e.stopPropagation()}>
            <div id="inventory" className={styles.inventoryContainer}>
                <div className={styles.inventoryHeader}>
                    <div className={styles.inventoryResource}>
                        <img src={goldIcon.src} />
                        {inventory?.gold}
                    </div>
                </div>
                
                <div className={styles.gearContainer}>
                    <div className={styles.weaponSlotWrapper}>
                        <p>Equipment</p>
                        <div 
                            className={
                                `${styles.gearSlot} ${(selectedSlot.displayIndex === 0 && selectedSlot.filter === "equipment") ? styles.selected : ""}`
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
                                if (!inventory?.weapon) return;

                                openItemPanel(inventory?.weapon); 
                                setSelectedSlot({ ...selectedSlot, filter: "equipment", displayIndex: 0 });
                            }}>
                            
                            {inventory?.weapon ? (
                                <>
                                <div className={styles.gearSlotIconContainer}>
                                    <img src={inventory.weapon.icon} className={styles.gearImg} />
                                </div>
                                <div className={styles.equippedWeaponInfoContainer}>
                                    <p style={{ color: `${colors[inventory?.weapon?.rarity]?.hex}` }}>{inventory.weapon.rarity.toUpperCase()}</p>
                                    <h3>{inventory?.weapon?.name.toUpperCase()}</h3>
                                </div>
                                </>
                            ) : (
                                <div className={styles.equippedWeaponInfoContainer}>
                                    <p>Weapon</p>
                                    <h3>None</h3>
                                </div>
                            )}
                            {inventory?.weapon?.level !== undefined && (
                                        <p className={styles.weaponLevel} style={{ color: `${inventory.weapon.level === 10 ? "#FFE500" : "#fff"}` }}>+{inventory.weapon.level}</p>
                            )}
                            {inventory?.weapon?.stats?.power !== undefined && (
                                <p className={styles.powerLevel}><img src={powerIconImg.src} />{inventory.weapon.stats.power}</p>
                            )}
                            {inventory?.weapon?.type === "Weapon" && (
                                <div className={styles.specializationIcon}><img src={inventory?.weapon?.specialization?.icon} /></div>
                            )}
                            <div className={styles.hoverContainer}>
                                <div className={styles.topRight}></div>
                                <div className={styles.bottomLeft}></div>
                                <div className={styles.topLeft}></div>
                                <div className={styles.bottomRight}></div>
                            </div>
                        </div>


                        <div 
                            className={
                                `${styles.gearSlot} ${(selectedSlot.displayIndex === 1 && selectedSlot.filter === "equipment") ? styles.selected : ""}`
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
                                if (!inventory?.armor) return;

                                openItemPanel(inventory?.armor); 
                                setSelectedSlot({ ...selectedSlot, filter: "equipment", displayIndex: 1 });
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
                            {inventory?.armor?.level !== undefined && (
                                        <p className={styles.weaponLevel} style={{ color: `${inventory.armor.level === 10 ? "#FFE500" : "#fff"}` }}>+{inventory.armor.level}</p>
                            )}
                            {inventory?.armor?.stats?.power !== undefined && (
                                <p className={styles.powerLevel}><img src={powerIconImg.src} />{inventory.armor.stats.power}</p>
                            )}
                            <div className={styles.hoverContainer}>
                                <div className={styles.topRight}></div>
                                <div className={styles.bottomLeft}></div>
                                <div className={styles.topLeft}></div>
                                <div className={styles.bottomRight}></div>
                            </div>
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
                        <button 
                            onClick={() => setSelectedFilter("material")} className={`${styles.filterBtn} ${selectedFilter === "material" ? styles.filterSelected : ""}`}
                            onMouseEnter={() => setHoveredFilter("material")}
                            onMouseLeave={() => setHoveredFilter(null)}
                        >
                            Material<img src={
                                selectedFilter === "material" || hoveredFilter === "material"
                                        ? materialIconSelected.src
                                        : materialIcon.src
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
                                        slot && (selectedSlot.displayIndex === displayIndex && selectedSlot.filter === selectedFilter) ? styles.selected : ""
                                    }`}
                                    onClick={() => {
                                        if (!slot) return;

                                        openItemPanel(slot);
                                        setSelectedSlot({ filter: selectedFilter, displayIndex: displayIndex, realIndex: realIndex })
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
                                    {slot?.type === "Weapon" && (
                                        <div className={styles.specializationIcon}><img src={slot.specialization?.icon} /></div>
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
                <div id="item-info-panel" className={itemPanelOpen ? `${styles.itemInfoPanel} ${styles.open}` : styles.itemInfoPanel}>
                    <div className={styles.itemIconContainer}>
                        {selectedItem && (
                            <>
                                <img src={selectedItem.icon} className={styles.selectedOtherImg} />
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
                                {selectedItem.type === "Weapon" && (
                                    <div className={styles.specialization} style={{ color: `${specializationColors[selectedItem.specialization?.name]?.color}`, background: `${specializationColors[selectedItem.specialization?.name]?.background}`, borderColor: `${specializationColors[selectedItem.specialization?.name]?.color}` }}><img src={selectedItem.specialization?.icon} />{selectedItem.specialization?.name}</div>
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
                        
                        <div className={styles.itemDescContainer}>
                            <div id="item-info-text">
                                <h1 id="item-info-name"></h1>
                                <p id="item-info-type"></p>
                            </div>
                            <p id="item-info-description"></p>
                            <div id="item-info-stats"></div>
                            <div className={styles.equipBtnContainer}>
                                {!selectedIsEquipped ? (
                                    <button
                                        className={styles.equipBtn}
                                        onClick={async () => {
                                            const updatedInventory = await equipSelectedItem();

                                            const newSelected =
                                                selectedItem.type === "Weapon"
                                                    ? updatedInventory?.weapon
                                                    : updatedInventory?.armor;

                                            if (newSelected) {
                                                setSelectedItem(newSelected);
                                            }

                                            setSelectedSlot(
                                                selectedItem.type === "Weapon"
                                                    ? { filter: "equipment", realIndex: -1, displayIndex: 0 }
                                                    : { filter: "equipment", realIndex: -1, displayIndex: 1 }
                                            );
                                        }}
                                    >
                                        EQUIP
                                    </button>
                                ) : (
                                    <button
                                        className={styles.unequipBtn}
                                        onClick={async () => {
                                            await unequipSelectedItem();
                                            setItemPanelOpen(false);
                                            setSelectedItem(null);
                                        }}
                                    >
                                        UNEQUIP
                                    </button>
                                )}
                            </div>
                            
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    )
}
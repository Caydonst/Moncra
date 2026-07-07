import styles from "./inventory.module.css"
import { Inventory } from "../../inventory/inventory"
import {Ammunition, Item, Material, Weapon, Armor} from "../../items/ItemTypes";
import React, { useEffect, useState } from "react";
import type { GameScene } from "../../scenes/GameScene";
import {XMarkIcon} from "@heroicons/react/24/solid"
import powerIconImg from "../../assets/misc/power_icon.png"
import arrowIcon from "../../assets/icons/arrow_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import critIcon from "../../assets/icons/crit_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import armorStatIcon from "../../assets/icons/armor_stat_icon.png"
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import materialIcon from "@/app/game/assets/icons/material_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import materialIconSelected from "@/app/game/assets/icons/material_icon_selected.png"
import goldIcon from "@/app/game/assets/currency/gold_icon.png"
import plusIcon from "@/app/game/assets/icons/plus_icon.png"
import { equippableItems } from "../../items/ItemTypes";
import { colors, specializationColors } from "../../utils/uiUtils"
import { createClientInventory } from "../../inventory/createClientInventory";
import { gameState } from "../../gameState/gameState";
import { GearSlot } from "./GearSlot";

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
    filter: Filter;
    displayIndex: number;
    realIndex: number;
    itemId: string | null;
};

export default function InventoryUI({ inventoryOpen, setInventoryOpen, inventory, setInventory, itemPanelOpen, setItemPanelOpen, selectedItem, setSelectedItem, engine }: Props) {
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>({
        filter: "all",
        displayIndex: -1,
        realIndex: -1,
        itemId: null,
    });
    const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
    const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
    const [playerStats, setPlayerStats] = useState({
        power: 0,
        damage: 0,
        crit: 0,
        armor: 0,
        hp: 100,
        maxHp: 100,
    });

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
            setSelectedSlot({
                filter: "all",
                displayIndex: -1,
                realIndex: -1,
                itemId: null,
            });
        }
    }, [inventoryOpen])

    useEffect(() => {
        console.log(selectedSlot);
    }, [selectedSlot])

    useEffect(() => {
        function handlePlayerStatsUpdated(e: Event) {
            const event = e as CustomEvent;

            setPlayerStats(event.detail);
        }

        window.addEventListener("player_stats_updated", handlePlayerStatsUpdated);

        return () => {
            window.removeEventListener("player_stats_updated", handlePlayerStatsUpdated);
        };
    }, []);

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
            ? !!selectedItem.uid && selectedItem.uid === inventory?.helmet?.uid ||
                !!selectedItem.uid && selectedItem.uid === inventory?.arms?.uid ||
                !!selectedItem.uid && selectedItem.uid === inventory?.chest?.uid ||
                !!selectedItem.uid && selectedItem.uid === inventory?.legs?.uid
            : false;

    useEffect(() => {
        if (!engine) return;
        if (!inventory?.weapon) return;
        if (inventory.weapon.instance) return;

        gameState.inventory = inventory;

        let cancelled = false;

        const spawn = async () => {
            if (cancelled) return;
            await inventory.spawnEquippedWeapon(engine);
        };

        spawn();

        return () => {
            cancelled = true;
        };
    }, [engine, inventory?.weapon?.uid]);

    useEffect(() => {
        function handleInventoryUpdated(e: Event) {
            const event = e as CustomEvent;

            const clientInventory = createClientInventory(event.detail, gameState);

            gameState.inventory = clientInventory;
            setInventory(clientInventory);

            if (!selectedItem) return;

            let equippedItem: Weapon | Armor | null = null;
            let slotIndex = -1;

            if (selectedItem.type === "Weapon") {
                equippedItem = clientInventory.weapon;
                slotIndex = 0;
            } else {
                switch (selectedItem.kind) {
                    case "helmet":
                        equippedItem = clientInventory.helmet;
                        slotIndex = 1;
                        break;
                    case "arms":
                        equippedItem = clientInventory.arms;
                        slotIndex = 2;
                        break;
                    case "chest":
                        equippedItem = clientInventory.chest;
                        slotIndex = 3;
                        break;
                    case "legs":
                        equippedItem = clientInventory.legs;
                        slotIndex = 4;
                        break;
                }
            }

            if (equippedItem) {
                setSelectedItem(equippedItem);

                setSelectedSlot({
                    filter: "equipment",
                    displayIndex: slotIndex,
                    realIndex: -1,
                    itemId: equippedItem.uid,
                });
            }
        }

        window.addEventListener("inventory_updated", handleInventoryUpdated);

        return () => {
            window.removeEventListener("inventory_updated", handleInventoryUpdated);
        };
    }, [selectedSlot]);

    async function equipSelectedItem() {
        if (!inventory || !engine || !selectedItem) return null;

        const { multiplayer } = await import("../../network/multiplayer");

        multiplayer.sendEquipItem(selectedItem.uid);

        return null;
    }

    async function unequipSelectedItem() {
        if (!inventory || !selectedItem) return;

        let slot: "weapon" | "helmet" | "arms" | "chest" | "legs" | null = null;

        if (selectedItem.type === "Weapon") {
            slot = "weapon";
        }

        if (selectedItem.type === "Armor") {
            if (selectedItem.uid === inventory.helmet?.uid) slot = "helmet";
            else if (selectedItem.uid === inventory.arms?.uid) slot = "arms";
            else if (selectedItem.uid === inventory.chest?.uid) slot = "chest";
            else if (selectedItem.uid === inventory.legs?.uid) slot = "legs";
        }

        if (!slot) {
            console.error("Selected item is not currently equipped", selectedItem);
            return;
        }

        if (slot === "weapon") {
            await inventory.removeEquippedWeaponActor(engine);
        }

        const { multiplayer } = await import("../../network/multiplayer");

        multiplayer.sendUnequipItem(slot);

        setSelectedItem(null);
        setItemPanelOpen(false);
        setSelectedSlot({
            filter: "all",
            displayIndex: -1,
            realIndex: -1,
            itemId: null,
        });
    }

    useEffect(() => {
        console.log(selectedSlot);
    }, [selectedSlot])

    const xpPercent = Math.min(100, Math.max(0, (210 / 300) * 100));

    return (
        <div id="inventory-wrapper" className={inventoryOpen ? `${styles.inventoryWrapper} ${styles.open}` : styles.inventoryWrapper} onClick={(e) => e.stopPropagation()}>
            <div id="inventory" className={styles.inventoryContainer}>
                <div className={styles.inventoryHeader}>
                    <div className={styles.inventoryResource}>
                        <img src={goldIcon.src} />
                        {inventory?.gold}
                    </div>
                </div>
                <div className={styles.inventoryContainerInner}>
                    <div className={styles.gearContainer}>
                        <div className={styles.gearContainerHeader}>
                            <div className={styles.playerStatsContainer}>
                                <div
                                    className={styles.levelCircle}
                                    style={{ "--xp-progress": xpPercent } as React.CSSProperties}
                                >
                                    <div className={styles.levelCircleInner}>
                                        <div className={styles.playerLevel}>
                                            <p>LEVEL</p>
                                            <p>24</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.playerGearStatsContainer}>
                                    <p className={styles.gearPowerLabel}>GEAR POWER</p>
                                    <div className={styles.playerPowerContainer}>
                                        <div className={styles.gearPower}>
                                            <img src={powerIconImg.src} />
                                            <p>{playerStats.power}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.playerStatsInner}>
                                <div className={styles.stat}>
                                    <img src={damageIcon.src} />
                                    <p>{playerStats.damage}</p>
                                </div>
                                <div className={styles.stat}>
                                    <img src={critIcon.src} />
                                    <p>{playerStats.crit}</p>
                                </div>
                                <div className={styles.stat}>
                                    <img src={armorStatIcon.src} />
                                    <p>{playerStats.armor}</p>
                                </div>
                                <div className={styles.stat}>
                                    <img src={hpIcon.src} />
                                    <p>{playerStats.maxHp}</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.weaponSlotWrapper}>
                            <div className={styles.weaponContainer}>
                                <div className={styles.weaponContainerHeader}>
                                    <img src={weaponIcon.src} />
                                    <p>Weapon</p>
                                </div>
                                <div className={styles.slotsContainer}>
                                    <GearSlot slotIndex={0} item={inventory?.weapon} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} />
                                </div>
                            </div>
                            <div className={styles.armorContainer}>
                                <div className={styles.weaponContainerHeader}>
                                    <img src={armorIcon.src} />
                                    <p>Armor</p>
                                </div>
                                <div className={styles.slotsContainer}>
                                    <GearSlot slotIndex={1} item={inventory?.helmet} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} />
                                    <GearSlot slotIndex={2} item={inventory?.arms} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} />
                                    <GearSlot slotIndex={3} item={inventory?.chest} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} />
                                    <GearSlot slotIndex={4} item={inventory?.legs} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} />
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
                                        className={`${styles.slot} ${slot ? styles[slot.rarity] : ""} ${slot && selectedSlot.itemId === slot.uid ? styles.selected : ""
                                            }`}
                                        onClick={() => {
                                            if (!slot) return;

                                            openItemPanel(slot);
                                            setSelectedSlot({
                                                filter: selectedFilter,
                                                displayIndex,
                                                realIndex,
                                                itemId: slot.uid,
                                            });
                                        }}
                                    >
                                        {slot?.icon && (
                                            <div className={styles.slotIconContainer}>
                                                {slot.type === "Weapon" ? (
                                                    <img src={slot.icon} className={styles.slotIconWeapon} />
                                                ) : (
                                                    slot.type === "Armor" ? (
                                                        <img src={slot.icon} className={styles.slotIconArmor} />
                                                    )
                                                        :
                                                        (
                                                            <img src={slot.icon} className={styles.slotIconOther} />
                                                        )
                                                )}
                                            </div>
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
                                                <p className={styles.powerText}><img src={powerIconImg.src} />{selectedItem.stats?.power}</p>
                                                <p>|</p>
                                            </>
                                        )}
                                        <p className={styles[`${selectedItem.rarity}`]}>{selectedItem.rarity.toUpperCase()}</p>
                                    </div>
                                    <h3 className={styles.itemName}>{selectedItem.name.toUpperCase()}</h3>
                                    <div className={styles.weaponTypeContainer}>
                                        <p className={styles.weaponTypeName}>{selectedItem.type}</p>
                                    </div>
                                    {selectedItem?.level !== undefined && (
                                        <div className={styles.selectedWeaponLevel} style={{ color: `${selectedItem?.level === 10 ? "#FFE500" : "#fff"}` }}>
                                            Level
                                            <div>
                                                +{selectedItem?.level}
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.itemStatsContainer}>
                                        {selectedItem.stats?.damage && (
                                            <>
                                                <div className={styles.statContainer}>
                                                    <div className={styles.statIconContainer}><img src={damageIcon.src} className={styles.damageIcon} /></div>
                                                    <p>{selectedItem.stats?.damage} Damage</p>
                                                </div>
                                                <div className={styles.statContainer}>
                                                    <div className={styles.statIconContainer}><img src={critIcon.src} className={styles.damageIcon} /></div>
                                                    <p>10 Crit</p>
                                                </div>
                                            </>
                                        )}
                                        {selectedItem.stats?.hp && (
                                            <>
                                                <div className={styles.statContainer}>
                                                    <div className={styles.statIconContainer}><img src={hpIcon.src} className={styles.hpIcon} /></div>
                                                    <p>{selectedItem.stats?.hp} HP</p>
                                                </div>
                                                <div className={styles.statContainer}>
                                                    <div className={styles.statIconContainer}><img src={armorStatIcon.src} className={styles.hpIcon} /></div>
                                                    <p>10 Armor</p>
                                                </div>
                                            </>
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
                                    <div id="item-info-stats"></div>
                                    {(selectedItem.type === "Armor" || selectedItem.type === "Weapon") && (
                                        <div className={styles.equipBtnContainer}>
                                            {!selectedIsEquipped ? (
                                                <button
                                                    className={styles.equipBtn}
                                                    onClick={async () => {
                                                        await equipSelectedItem();
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
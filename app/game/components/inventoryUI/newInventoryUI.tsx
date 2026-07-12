import styles from "./newInventory.module.css"
import { Inventory } from "../../inventory/inventory"
import { Ammunition, Item, Material, Weapon, Armor } from "../../items/ItemTypes";
import React, { useEffect, useRef, useState } from "react";
import type { GameScene } from "../../scenes/GameScene";
import { XMarkIcon } from "@heroicons/react/24/solid"
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
import ExtraSlot from "./ExtraSlot";
import ItemInfoPanel from "./ItemInfoPanel";
import ItemToolTip from "./ItemToolTip";

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
    const [itemInfoOpen, setItemInfoOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<Weapon | Armor | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    

    function openItemPanel(slot: any) {
        setSelectedItem(slot);
        if (slot) {
            setItemPanelOpen(true);
        }
    }

    useEffect(() => {
        if (!inventoryOpen) {
            setItemInfoOpen(false);
            console.log("INVENTORY:", inventory)
        }
    }, [inventoryOpen])

    useEffect(() => {
        if (!inventoryOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            console.log("key down")
            if (e.key !== "Escape") return;
            console.log("escape key down")

            if (itemInfoOpen) {
                console.log("Setting item info closed")
                setItemInfoOpen(false);
                return;
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        inventoryOpen,
        itemInfoOpen,
    ]);

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
        function handlePlayerStatsUpdated(e: Event) {
            const event = e as CustomEvent;

            setPlayerStats(event.detail);
        }

        window.addEventListener("player_stats_updated", handlePlayerStatsUpdated);

        return () => {
            window.removeEventListener("player_stats_updated", handlePlayerStatsUpdated);
        };
    }, []);

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

    function showItemTooltip(
        item: Weapon | Armor,
        e: React.MouseEvent
    ) {
        setHoveredItem(item);
        moveItemTooltip(e);
    }

    function moveItemTooltip(e: React.MouseEvent) {
        const tooltip = tooltipRef.current;

        const offset = 18;
        const padding = 10;

        let x = e.clientX + offset;
        let y = e.clientY + offset;

        if (tooltip) {
            const width = tooltip.offsetWidth;
            const height = tooltip.offsetHeight;

            if (x + width > window.innerWidth - padding) {
                x = e.clientX - width - offset;
            }

            if (y + height > window.innerHeight - padding) {
                y = e.clientY - height - offset;
            }

            x = Math.max(padding, x);
            y = Math.max(padding, y);
        }

        setTooltipPos({ x, y });
    }

    function hideItemTooltip() {
        setHoveredItem(null);
    }

    async function equipItem(item: Weapon | Armor | null) {
        if (!inventory || !engine || !item) return;

        const { multiplayer } = await import("../../network/multiplayer");

        multiplayer.sendEquipItem(item.uid);
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

    const xpPercent = Math.min(100, Math.max(0, (210 / 300) * 100));

    const weaponExtraItems = inventory?.miscWeapons.filter(Boolean) ?? [];

    const armorExtraItems = {
        helmet: inventory?.miscArmor.filter(item => item?.kind === "helmet") ?? [],
        arms: inventory?.miscArmor.filter(item => item?.kind === "arms") ?? [],
        chest: inventory?.miscArmor.filter(item => item?.kind === "chest") ?? [],
        legs: inventory?.miscArmor.filter(item => item?.kind === "legs") ?? [],
    };

    const weaponSlots = [
        { type: "weapon", slotIndex: 0, item: inventory?.weapon, extras: weaponExtraItems },
        { type: "off-hand", slotIndex: 1, item: null, extras: [] },
        { type: "amulet", slotIndex: 2, item: null, extras: [] },
    ];

    const armorSlots = [
        { type: "helmet", slotIndex: 3, item: inventory?.helmet, extras: armorExtraItems.helmet },
        { type: "arms", slotIndex: 4, item: inventory?.arms, extras: armorExtraItems.arms },
        { type: "chest", slotIndex: 5, item: inventory?.chest, extras: armorExtraItems.chest },
        { type: "legs", slotIndex: 6, item: inventory?.legs, extras: armorExtraItems.legs },
    ];

    useEffect(() => {
        console.log(itemInfoOpen)
    }, [itemInfoOpen])

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
                            
                        </div>
                        <div className={styles.weaponSlotWrapper}>
                            <div className={styles.weaponContainer}>
                                <div className={styles.slotsContainer}>
                                    {weaponSlots.map((slot, index) => (
                                        <div key={index} className={styles.gearSlotWrapper} style={{ zIndex: `${3-index}` }}>
                                            <ExtraSlot key={index} slot={slot} equipItem={equipItem} type={"Weapon"} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} />
                                            <GearSlot slotIndex={slot.slotIndex} item={slot.item} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} />
                                        </div>
                                    ))}
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
                                <div className={styles.topRight}></div>
                                <div className={styles.bottomLeft}></div>
                                <div className={styles.topLeft}></div>
                                <div className={styles.bottomRight}></div>
                            </div>
                            <div className={styles.armorContainer}>
                                <div className={styles.slotsContainer}>
                                    {armorSlots.map((slot, index) => (
                                        <div key={index} className={styles.gearSlotWrapper}>
                                            <GearSlot slotIndex={slot.slotIndex} item={slot.item} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} />
                                            <ExtraSlot key={index} slot={slot} equipItem={equipItem} type={"Armor"} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>    
                    <div className={styles.bgLightInventory}></div>        
                </div>
            </div>
            {hoveredItem && (
                <ItemToolTip tooltipRef={tooltipRef} tooltipPos={tooltipPos} hoveredItem={hoveredItem} />
            )}
            <ItemInfoPanel selectedItem={selectedItem} itemInfoOpen={itemInfoOpen} inventoryOpen={inventoryOpen} />
        </div>
    )
}
import styles from "../newInventory.module.css"
import { Inventory } from "../../../inventory/inventory"
import React, { useEffect, useRef, useState } from "react";
import powerIconImg from "../../../assets/misc/power_icon.png"
import damageIcon from "../../../assets/icons/damage_icon.png"
import critIcon from "../../../assets/icons/crit_icon.png"
import hpIcon from "../../../assets/icons/hp_icon.png"
import armorStatIcon from "../../../assets/icons/armor_stat_icon.png"
import { createClientInventory } from "../../../inventory/createClientInventory";
import { gameState } from "../../../gameState/gameState";
import { GearSlot } from "../GearSlot";
import ExtraSlot from "../ExtraSlot";
import { Armor, Weapon } from "@/app/game/items/ItemTypes";
import ItemToolTip from "../ItemToolTip";

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

export default function Gear({ inventoryOpen, setInventoryOpen, inventory, setInventory, itemPanelOpen, setItemPanelOpen, selectedItem, setSelectedItem, engine, setItemInfoOpen, itemInfoOpen }: Props) {
    const [playerStats, setPlayerStats] = useState({
        power: 0,
        damage: 0,
        crit: 0,
        armor: 0,
        hp: 100,
        maxHp: 100,
        level: 0,
        currentXp: 0,
        xpToNextLvl: 0,
    });
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>({
        filter: "all",
        displayIndex: -1,
        realIndex: -1,
        itemId: null,
    });
    const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
    const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
    
    const [hoveredItem, setHoveredItem] = useState<Weapon | Armor | null>(null);
    const [hoveredItemEquipped, setHoveredItemEquipped] = useState<boolean>(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedTab, setSelectedTab] = useState("gear");
    const [username, setUsername] = useState<string>("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [playerLevel, setPlayerLevel] = useState(0);
    const tooltipRef = useRef<HTMLDivElement>(null);

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
        if (!inventoryOpen) return;

        async function refreshStats() {
            const { multiplayer } = await import(
                "../../../network/multiplayer"
            );

            multiplayer.refreshLocalPlayerStats();
        }

        refreshStats();
    }, [inventoryOpen]);

    function openItemPanel(slot: any) {
        console.log("ITEM PANEL CHANGING")
        setSelectedItem(slot);
        if (slot) {
            setItemPanelOpen(true);
        }
    }

    useEffect(() => {
        if (!inventoryOpen) {
            setItemInfoOpen(false);
            setSelectedTab("gear");
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

            const clientInventory = createClientInventory(
                event.detail,
                gameState
            );

            gameState.inventory = clientInventory;
            console.log("GAMESTATE INVENTORY: ", gameState.inventory);
            setInventory(clientInventory);

            setSelectedItem(previousSelected => {
                if (!previousSelected) {
                    return null;
                }

                return (
                    findItemByUid(
                        clientInventory,
                        previousSelected.uid
                    ) ?? previousSelected
                );
            });
        }

        window.addEventListener(
            "inventory_updated",
            handleInventoryUpdated
        );

        return () => {
            window.removeEventListener(
                "inventory_updated",
                handleInventoryUpdated
            );
        };
    }, [setInventory, setSelectedItem]);

    function findItemByUid(
        inventory: Inventory,
        uid: string
    ): Weapon | Armor | null {
        const equippedItems: Array<
            Weapon | Armor | null | undefined
        > = [
                inventory.weapon,
                inventory.helmet,
                inventory.arms,
                inventory.chest,
                inventory.legs,
            ];

        const equippedItem = equippedItems.find(
            item => item?.uid === uid
        );

        if (equippedItem) {
            return equippedItem;
        }

        const miscWeapon = inventory.miscWeapons.find(
            item => item?.uid === uid
        );

        if (miscWeapon) {
            return miscWeapon;
        }

        const miscArmor = inventory.miscArmor.find(
            item => item?.uid === uid
        );

        if (miscArmor) {
            return miscArmor;
        }

        return null;
    }

    useEffect(() => {
        function handleItemUpgraded(e: Event) {
            const event = e as CustomEvent<{
                upgradedItem: Weapon | Armor;
                inventory: any;
            }>;

            const { upgradedItem, inventory: updatedInventory } =
                event.detail;

            const clientInventory = createClientInventory(
                updatedInventory,
                gameState
            );

            gameState.inventory = clientInventory;
            setInventory(clientInventory);

            setSelectedItem(previous => {
                if (!previous) return previous;

                return previous.uid === upgradedItem.uid
                    ? upgradedItem
                    : previous;
            });
        }

        window.addEventListener(
            "item_upgraded",
            handleItemUpgraded
        );

        return () => {
            window.removeEventListener(
                "item_upgraded",
                handleItemUpgraded
            );
        };
    }, [setInventory, setSelectedItem]);

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

    function getEquipmentSlotIndex(
        item: Weapon | Armor
    ): number | null {
        if (item.type === "Weapon") {
            return 0;
        }

        switch (item.kind) {
            case "helmet":
                return 3;

            case "arms":
                return 4;

            case "chest":
                return 5;

            case "legs":
                return 6;

            default:
                return null;
        }
    }

    async function equipItem(item: Weapon | Armor | null) {
        if (!inventory || !engine || !item) return;

        const { multiplayer } = await import("../../../network/multiplayer");

        multiplayer.sendEquipItem(item.uid);
    }

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
        { type: "lantern", slotIndex: 3, item: inventory?.lantern, extras: [] },
    ];

    const armorSlots = [
        { type: "helmet", slotIndex: 4, item: inventory?.helmet, extras: armorExtraItems.helmet },
        { type: "arms", slotIndex: 5, item: inventory?.arms, extras: armorExtraItems.arms },
        { type: "chest", slotIndex: 6, item: inventory?.chest, extras: armorExtraItems.chest },
        { type: "legs", slotIndex: 7, item: inventory?.legs, extras: armorExtraItems.legs },
    ];

    const xpPercent =
        playerStats.xpToNextLvl > 0
            ? Math.min(
                100,
                (playerStats.currentXp /
                    playerStats.xpToNextLvl) *
                100
            )
            : 0;

    return (
        <div className={styles.gearPage}>
            <div className={styles.levelXpWrapper}>
                <div className={styles.xpBar} style={{ width: `${xpPercent}%` }}></div>
            </div>
            <div className={styles.levelContainerOverlay}>
                <div className={styles.overlayLeft}></div>
                <div className={styles.levelContainer}>
                    <div className={styles.playerLevel}>
                        <p>LEVEL</p>
                        <p>{playerStats.level}</p>
                    </div>
                </div>
                <div className={styles.overlayRight}></div>
            </div>
            <div className={styles.inventoryContainerInner}>
                <div className={styles.gearContainer}>
                    <div className={styles.gearContainerHeader}>
                        <div className={styles.playerStatsContainer}>
                            <div className={styles.placeholder}></div>
                            {/*<div
                                    className={styles.levelCircle}
                                    style={{ "--xp-progress": xpPercent } as React.CSSProperties}
                                >
                                    <div className={styles.levelCircleInner}>
                                        <div className={styles.playerLevel}>
                                            <p>LEVEL</p>
                                            <p>24</p>
                                        </div>
                                    </div>
                                </div>*/}
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
                                    <div key={index} className={styles.gearSlotWrapper} style={{ zIndex: `${3 - index}` }}>
                                        <ExtraSlot key={index} slot={slot} equipItem={equipItem} type={"Weapon"} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} setHoveredItemEquipped={setHoveredItemEquipped} />
                                        <GearSlot slotIndex={slot.slotIndex} item={slot.item} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} setHoveredItemEquipped={setHoveredItemEquipped} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} />
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
                                <p>{playerStats.crit}%</p>
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
                                        <GearSlot slotIndex={slot.slotIndex} item={slot.item} selectedSlot={selectedSlot} openItemPanel={openItemPanel} setSelectedSlot={setSelectedSlot} setHoveredItemEquipped={setHoveredItemEquipped} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} />
                                        <ExtraSlot key={index} slot={slot} equipItem={equipItem} type={"Armor"} setSelectedItem={setSelectedItem} setItemInfoOpen={setItemInfoOpen} showItemTooltip={showItemTooltip} moveItemTooltip={moveItemTooltip} hideItemTooltip={hideItemTooltip} setHoveredItemEquipped={setHoveredItemEquipped} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {hoveredItem && (
                <ItemToolTip tooltipRef={tooltipRef} tooltipPos={tooltipPos} hoveredItem={hoveredItem} hoveredItemEquipped={hoveredItemEquipped} />
            )}
        </div>
    )
}
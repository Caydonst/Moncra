import styles from "./newInventory.module.css"
import { Inventory } from "../../inventory/inventory"
import { Ammunition, Item, Material, Weapon, Armor } from "../../items/ItemTypes";
import React, { useEffect, useRef, useState } from "react";
import type { GameScene } from "../../scenes/GameScene";
import { XMarkIcon, Cog8ToothIcon } from "@heroicons/react/24/solid"
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
import { createClient } from "@/lib/supabase/client";
import Settings from "./settings/settings";
import Gear from "./gear/gear";

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
    
    const [itemInfoOpen, setItemInfoOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<Weapon | Armor | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedTab, setSelectedTab] = useState("gear");
    const [username, setUsername] = useState<string>("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        async function loadUsername() {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) {
                console.error(
                    "Failed to get logged-in user:",
                    authError
                );
                return;
            }

            if (!user) {
                console.error("No logged-in user found.");
                return;
            }

            const {
                data,
                error,
            } = await supabase
                .from("users")
                .select("username")
                .eq("uid", user.id)
                .single();

            if (error) {
                console.error(
                    "Failed to load username:",
                    error
                );
                return;
            }

            setUsername(data.username);
        }

        loadUsername();
    }, []);

    useEffect(() => {
            if (!inventoryOpen) return;
    
            async function refreshStats() {
                const { multiplayer } = await import(
                    "../../network/multiplayer"
                );
    
                multiplayer.refreshLocalPlayerStats();
            }
    
            refreshStats();
        }, [inventoryOpen]);


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

    const xpPercent = Math.min(100, Math.max(0, (210 / 300) * 100));

    

    return (
        <div id="inventory-wrapper" className={inventoryOpen ? `${styles.inventoryWrapper} ${styles.open}` : styles.inventoryWrapper} onClick={(e) => e.stopPropagation()}>
            <div id="inventory" className={styles.inventoryContainer}>
                <div className={styles.inventoryHeader}>
                    <div className={styles.inventoryHeaderInner}>
                        <div className={styles.headerNameContainer}>
                            <p>-</p>
                            <h3>{username}</h3>
                            <p>LEVEL {playerStats.level}</p>
                        </div>
                        <div className={styles.tabsContainer}>
                            <button className={selectedTab === "gear" ? styles.selected : ""} onClick={() => setSelectedTab("gear")}>GEAR</button>
                            <button className={selectedTab === "inventory" ? styles.selected : ""} onClick={() => setSelectedTab("inventory")}>INVENTORY</button>
                            <button className={selectedTab === "settings" ? styles.selected : ""} onClick={() => setSelectedTab("settings")}><Cog8ToothIcon className={styles.icon} /></button>
                        </div>
                    </div>
                </div>
                {selectedTab === "gear" && (
                    <Gear inventoryOpen={inventoryOpen} inventory={inventory} setInventory={setInventory} setInventoryOpen={setInventoryOpen} itemPanelOpen={itemPanelOpen} setItemPanelOpen={setItemPanelOpen} selectedItem={selectedItem} setSelectedItem={setSelectedItem} engine={engine} setItemInfoOpen={setItemInfoOpen} itemInfoOpen={itemInfoOpen} />
                )}
                
                {selectedTab === "settings" && (
                    <Settings settingsOpen={settingsOpen} />
                )}
            </div>
            <ItemInfoPanel selectedItem={selectedItem} itemInfoOpen={itemInfoOpen} inventoryOpen={inventoryOpen} />
        </div>
    )
}
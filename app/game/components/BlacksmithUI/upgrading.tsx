import { useState } from "react";
import styles from "./blacksmith.module.css"
import { Item, Material, Weapon } from "../../items/ItemTypes";
import { Inventory } from "../../inventory/inventory";
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import goldIcon from "@/app/game/assets/currency/gold_icon.png"
import powerIconImg from "../../assets/misc/power_icon.png"
import { colors } from "../../utils/uiUtils"
import { Armor } from "../../armor/armor";
import { upgrade } from "./helperFunctions"
import { getUpgradeCost } from "../../items/UpgradeCosts";
import { createClientInventory } from "../../inventory/createClientInventory";
import { gameState } from "../../gameState/gameState";

type Props = {
    blacksmithOpen: boolean;
    inventory: Inventory;
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>
}

type Filter = "all" | "weapons" | "armor" | "material" | "equipment";
type SelectedSlot = {
    filter: Filter,
    displayIndex: number,
    realIndex: number,
};

export default function Upgrading({ blacksmithOpen, inventory, setInventory }: Props) {
    const [selectedItem, setSelectedItem] = useState<Weapon | Armor |  null>(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
    const [realItemIndex, setRealItemIndex] = useState(-1);
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

    const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot>({ filter: "all", displayIndex: -1, realIndex: -1 })

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

    const filteredItems = (() => {
        if (!inventory) return [];

        let sourceItems = [];

        switch (selectedFilter) {
            case "weapons":
                sourceItems = [
                    {
                        item: inventory.weapon,
                        realIndex: -2,
                        source: "equippedWeapon" as const,
                    },
                    ...inventory.miscWeapons.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "weapon" as const,
                    })),
                ];
                break;

            case "armor":
                sourceItems = [
                    {
                        item: inventory.armor,
                        realIndex: -2,
                        source: "equippedArmor" as const,
                    },
                    ...inventory.miscArmor.map((item, realIndex) => ({
                    item,
                    realIndex,
                    source: "armor" as const,
                    })),
                ];
                break;

            default:
                sourceItems = [
                    {
                        item: inventory.weapon,
                        realIndex: -2,
                        source: "equippedWeapon" as const,
                    },
                    {
                        item: inventory.armor,
                        realIndex: -2,
                        source: "equippedArmor" as const,
                    },
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
                ];
        }

        const filledSlots = sourceItems.filter(({ item }) => item !== null);

        return [...filledSlots];
    })();
    /*
    function upgradeItem(goldCost: number) {
        if (!selectedItem) return;

        const upgradedItem = upgrade(selectedItem, goldCost);
        if (!upgradedItem) return;

        setSelectedItem(upgradedItem);
        //filteredInventoryItems[selectedItemIndex] = upgradedItem;
        
        if (selectedItem === inventory.weapon) {
            inventory.weapon = upgradedItem as Weapon;
        } else if (selectedItem === inventory.armor) {
            inventory.armor = upgradedItem as Armor;
        } else {
            if (selectedItem.type === "Weapon") {
                inventory.miscWeapons[selectedSlot.realIndex] = upgradedItem;
            } else if (selectedItem.type === "Armor") {
                inventory.miscArmor[selectedSlot.realIndex] = upgradedItem;
            
            }
        

        //filteredInventoryItems[selectedItemIndex] = upgradedItem;
        }
    }
        */

    async function upgradeItem() {
        if (!selectedItem || !inventory || !gameState.engine) return;

        const wasEquippedWeapon =
            selectedItem.type === "Weapon" &&
            selectedItem.uid === inventory.weapon?.uid;

        if (wasEquippedWeapon) {
            inventory.removeEquippedWeaponActor(gameState.engine);
        }

        const res = await fetch("/api/upgrade-item", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uid: selectedItem.uid,
            }),
        });

        const data = await res.json();

        if (!res.ok) return;

        const clientInventory = createClientInventory(data.inventory, gameState);

        gameState.inventory = clientInventory;
        setInventory(clientInventory);

        if (wasEquippedWeapon && clientInventory.weapon) {
            await clientInventory.spawnEquippedWeapon(gameState.engine);
            setSelectedItem(clientInventory.weapon);
        } else {
            setSelectedItem(data.upgradedItem);
        }
    }

    return (
        <div className={styles.evolvingContainer}>
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
                </div>
                <div className={styles.inventoryInner}>
                    <div id="misc-grid" className={styles.miscGrid}>
                        {filteredItems.map(({ item: slot, realIndex }, displayIndex) => (
                            <div
                                key={displayIndex}
                                className={`${styles.slot} ${
                                    slot && (selectedSlot.displayIndex === displayIndex && selectedSlot.filter === selectedFilter) ? styles.selected : ""
                                }`}
                                onClick={() => {
                                    if (!slot) return;
                                    setSelectedItem(slot);
                                    setSelectedItemIndex(displayIndex)
                                    setRealItemIndex(realIndex)
                                    setSelectedSlot({ filter: selectedFilter, displayIndex: displayIndex, realIndex: realIndex })
                                }}
                                style={{ 
                                    background: `linear-gradient(
                                            to right,
                                            ${colors[slot?.rarity]?.rgba ?? "rgba(255,255,255,0.1)"},
                                            transparent
                                        )`,
                                    borderColor: `${colors[slot?.rarity]?.hex}` }}
                            >
                                {slot?.icon && (
                                    <div className={styles.miscSlotIconContainer}>
                                        <img src={slot.icon} className={styles.slotImg} />
                                    </div>
                                )}
                                <div className={styles.miscItemNameContainer}>
                                    <p style={{ color: `${colors[slot?.rarity]?.hex}` }}>{slot?.rarity.toUpperCase()}</p>
                                    <p>{slot?.name.toUpperCase()}</p>
                                </div>
                                {slot?.level !== undefined && (
                                    <p className={styles.weaponLevel} style={{ color: `${slot.level === 10 ? "#FFE500" : "#fff"}` }}>+{slot.level}</p>
                                )}
                                {slot?.stats?.power !== undefined && (
                                    <p className={styles.powerLevel}><img src={powerIconImg.src} />{slot.stats.power}</p>
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
            <div className={styles.selectedItemContainer}>
                {selectedItem !== null ? (
                    <>
                    <div className={styles.upgradingInfoContainer}>
                        <div className={styles.itemIconContainer}>
                            <img src={selectedItem?.icon} />
                            {selectedItem?.rarity !== undefined && (
                                <div className={styles.bgLight} style={{ background: `${colors[selectedItem?.rarity]?.hex}` }}></div>
                            )}
                        </div>
                        <div className={styles.nameContainer}>
                            <h3>{selectedItem?.name.toUpperCase()}</h3>
                            <p style={{ color: `${colors[selectedItem?.rarity]?.hex}` }}>{selectedItem?.rarity.toUpperCase()}</p>
                        </div>
                    </div>
                    <div className={styles.statsDisplayContainer}>
                        {selectedItem.level < selectedItem.maxLevel ? (
                            <>
                            <div className={styles.currentLevelContainer}>
                                {selectedItem?.level !== undefined && (
                                    <p className={styles.level}>Level +{selectedItem.level}</p>
                                )}
                                <p className={styles.stats}>Damage: {selectedItem?.stats.damage}</p>
                            </div>
                            <p>{"-->"}</p>
                            <div className={styles.nextLevelContainer}>
                                {selectedItem?.level !== undefined && (
                                    <p className={styles.level}>Level +{selectedItem.level + 1}</p>
                                )}
                                <div className={styles.damageIncreaseContainer}>
                                    <p className={styles.stats}>Damage: {selectedItem?.stats.damage + 2}</p>
                                    <p className={styles.stats}>(+2)</p>
                                </div>
                            </div>
                            </>
                        ) : (
                            <div className={styles.maxLevelContainer}>
                                <p>Level 10</p>
                                <h3>MAX LEVEL</h3>
                            </div>
                        )}
                    </div>
                    {selectedItem.level < selectedItem.maxLevel && (
                        <>
                        <div className={styles.materialsContainer}>
                            <div className={styles.material}>
                                <div className={styles.materialIcon}>
                                    <div className={styles.materialBgLight}></div>
                                    <img src={goldIcon.src} />
                                </div>
                                <p>{inventory?.gold} / {getUpgradeCost(selectedItem).gold}</p>
                            </div>
                            {getUpgradeCost(selectedItem).materials.map((material, index) => (
                                
                                <div key={index} className={styles.material}>
                                    {console.log(material)}
                                    <div className={styles.materialIcon}>
                                        <div className={styles.materialBgLight} style={{ background: `${colors[material.material.rarity].hex}` }}></div>
                                        <img src={material.material.icon} style={{ filter: `drop-shadow(0 0 3px ${colors[material.material.rarity].hex})` }} />
                                    </div>
                                    <p>23 / {material.quantity}</p>
                                </div>
                            ))}
                        </div>
                        <button className={styles.upgradeBtn} onClick={() => upgradeItem(getUpgradeCost(selectedItem).gold)}>UPGRADE</button>
                        </>
                    )}
                    </>
                    
                ) : (
                    <div>No item selected</div>
                )}
                
                
            </div>
        </div>
    )
}
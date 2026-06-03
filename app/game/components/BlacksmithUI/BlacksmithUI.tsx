import { Inventory } from "../../inventory/inventory";
import styles from "./blacksmith.module.css"
import allIcon from "@/app/game/assets/icons/all_icon.png"
import weaponIcon from "@/app/game/assets/icons/weapon_icon.png"
import armorIcon from "@/app/game/assets/icons/armor_icon.png"
import allIconSelected from "@/app/game/assets/icons/all_icon_selected.png"
import weaponIconSelected from "@/app/game/assets/icons/weapon_icon_selected.png"
import armorIconSelected from "@/app/game/assets/icons/armor_icon_selected.png"
import { useState } from "react";

type Props = {
    blacksmithOpen: boolean;
    inventory: Inventory;
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

export default function BlacksmithUI({ blacksmithOpen, inventory }: Props) {
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

    return (
        <div className={`${styles.blacksmithWrapper} ${blacksmithOpen ? styles.open : ""}`}>
            <div className={`${styles.blacksmithContainer} ${blacksmithOpen ? styles.open : ""}`}>
                <div className={styles.blacksmithInner}>
                    <div className={styles.inventory}>
                        <h3>INVENTORY</h3>
                        <div className={styles.itemFilterContainer}>
                            <button 
                                onClick={() => setSelectedFilter("all")} className={`${styles.filterBtn} ${selectedFilter === "all" ? styles.selected : ""}`}
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
                                onClick={() => setSelectedFilter("weapons")} className={`${styles.filterBtn} ${selectedFilter === "weapons" ? styles.selected : ""}`}
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
                                onClick={() => setSelectedFilter("armor")} className={`${styles.filterBtn} ${selectedFilter === "armor" ? styles.selected : ""}`}
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
                                {inventory?.misc.map((slot, i) => (
                                    <div key={i} id={`misc-slot-${i}`} className={`${styles.slot} ${slot ? styles[slot.rarity] : ""}`}>
                                        {slot && <img src={slot.icon} className={styles.slotImg} />}

                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.upgradeContainer}></div>
                </div>
            </div>
        </div>
    )
}
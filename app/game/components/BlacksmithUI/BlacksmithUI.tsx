import { Inventory } from "../../inventory/inventory";
import styles from "./blacksmith.module.css"

import { useState } from "react";
import { Item, Weapon } from "../../items/ItemTypes";
import Evolving from "./evolving"
import Upgrading from "./upgrading";

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
    const [selectedItem, setSelectedItem] = useState(-1);
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

    const [selectedFilter, setSelectedFilter] = useState("crafting");

    return (
        <div className={`${styles.blacksmithWrapper} ${blacksmithOpen ? styles.open : ""}`}>
            <div className={`${styles.blacksmithContainer} ${blacksmithOpen ? styles.open : ""}`}>
                <div className={styles.blacksmithInner}>
                    <div className={styles.buttonsContainer}>
                        <button className={selectedFilter === "crafting" ? styles.selectedFilter : ""} onClick={() => setSelectedFilter("crafting")}>Crafting</button>
                        <button className={selectedFilter === "upgrading" ? styles.selectedFilter : ""} onClick={() => setSelectedFilter("upgrading")}>Upgrading</button>
                        <button className={selectedFilter === "evolving" ? styles.selectedFilter : ""} onClick={() => setSelectedFilter("evolving")}>Evolving</button>
                    </div>
                    {selectedFilter === "upgrading" && (
                        <Upgrading blacksmithOpen={blacksmithOpen} inventory={inventory}  />
                    )}
                    {selectedFilter === "evolving" && (
                        <Evolving blacksmithOpen={blacksmithOpen} inventory={inventory}  />
                    )}
                    
                </div>
            </div>
        </div>
    )
}
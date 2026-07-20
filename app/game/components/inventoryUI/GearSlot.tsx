import { Inventory } from "../../inventory/inventory";
import styles from "./newInventory.module.css"
import { colors, specializationColors } from "../../utils/uiUtils"
import powerIconImg from "../../assets/misc/power_icon.png"
import { Weapon, Armor } from "../../items/ItemTypes";
import plusIcon from "@/app/game/assets/icons/plus_icon.png"
import lockIcon from "@/app/game/assets/icons/lock_icon.png"
import upgradeIcon from "@/app/game/assets/icons/upgrade_button_icon.png"

type Props = {
    slotIndex: number;
    item: Weapon | Armor | null | undefined;
    selectedSlot: any;
    openItemPanel: any;
    setSelectedSlot: any;
    setSelectedItem: React.Dispatch<React.SetStateAction<any>>;
    setItemInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showItemTooltip: (item: Weapon | Armor, e: React.MouseEvent) => void;
    moveItemTooltip: (e: React.MouseEvent) => void;
    hideItemTooltip: () => void;
}

export function GearSlot({ slotIndex, item, selectedSlot, openItemPanel, setSelectedSlot, setSelectedItem, setItemInfoOpen, showItemTooltip, moveItemTooltip, hideItemTooltip }: Props) {

    const indexToType = {
        0: "Weapon",
        3: "Helmet",
        4: "Arms",
        5: "Chest",
        6: "Legs",
    }

    return (
        <div
            className={
                `${styles.gearSlot} ${(selectedSlot.displayIndex === slotIndex && selectedSlot.filter === "equipment") ? styles.selected : ""}`
            }
            style={{
                background: `${colors[item?.rarity]?.hex ?? "transparent"}`,
                borderColor: `${colors[item?.rarity]?.hex ?? "rgba(255, 255, 255, 0.2)"}`
            }}
            onClick={() => {
                if (!item) return;

                setSelectedSlot({
                    filter: "equipment",
                    displayIndex: slotIndex,
                    realIndex: -1,
                });
            }}
            onMouseEnter={(e) => showItemTooltip(item, e)}
            onMouseMove={moveItemTooltip}
            onMouseLeave={hideItemTooltip}
            onContextMenu={(e) => {
                e.preventDefault(); // Prevent browser context menu
                setSelectedItem(item)
                setItemInfoOpen(true);
                hideItemTooltip();
            }}
            >

            {item ? (
                <>
                    <div className={styles.gearSlotIconContainer}>
                        {item.type === "Weapon" ? (
                            <img src={item.icon} className={styles.gearWeaponImg} />
                        ) : (
                            <img src={item.icon} className={styles.gearOtherImg} />
                        )}
                    </div>
                    <div className={styles.weaponXpContainer}>
                        <div className={styles.weaponXp} style={{ width: `${(item.currentXp / item.nextLvlXp) * 100}%` }}></div>
                    </div>
                    {item.availableUpgradePoints > 0 && (
                        <div className={styles.levelAvailableContainer}>
                            <img src={upgradeIcon.src} />
                        </div>
                    )}
                </>
                
            ) : (
                indexToType[slotIndex] !== undefined ? (
                    <div className={styles.gearSlotEmptyContainer}>
                        <p className={styles.noneText}>{indexToType[slotIndex]}</p>
                    </div>
                ) : (
                    <div className={styles.gearSlotEmptyContainer}>
                        <img src={lockIcon.src} />
                    </div>
                )
            )}
        </div>
    )
}
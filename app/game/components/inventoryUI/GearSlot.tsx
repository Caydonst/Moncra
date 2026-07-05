import { Inventory } from "../../inventory/inventory";
import styles from "./inventory.module.css"
import { colors, specializationColors } from "../../utils/uiUtils"
import powerIconImg from "../../assets/misc/power_icon.png"
import { Weapon, Armor } from "../../items/ItemTypes";
import plusIcon from "@/app/game/assets/icons/plus_icon.png"

type Props = {
    slotIndex: number;
    item: Weapon | Armor | null | undefined;
    selectedSlot: any;
    openItemPanel: any;
    setSelectedSlot: any;
}

export function GearSlot({ slotIndex, item, selectedSlot, openItemPanel, setSelectedSlot }: Props) {

    return (
        <div
            className={
                `${styles.gearSlot} ${(selectedSlot.displayIndex === slotIndex && selectedSlot.filter === "equipment") ? styles.selected : ""}`
            }
            style={{
                background: `${colors[item?.rarity]?.rgba ?? "transparent"}`,
                borderColor: `${colors[item?.rarity]?.hex ?? "rgba(255, 255, 255, 0.2)"
                    }`
            }}
            onClick={() => {
                if (!item) return;

                openItemPanel(item);
                setSelectedSlot({
                    filter: "equipment",
                    displayIndex: slotIndex,
                    realIndex: -1,
                });
            }}>

            {item ? (
                <div className={styles.gearSlotIconContainer}>
                    {item.type === "Weapon" ? (
                        <img src={item.icon} className={styles.gearWeaponImg} />
                    ) : (
                            <img src={item.icon} className={styles.gearOtherImg} />
                    )}
                </div>
            ) : (
                <div className={styles.gearSlotIconContainer}>
                    <p className={styles.noneText}>None</p>
                </div>
            )}
            {item?.level !== undefined && (
                <div className={styles.weaponLevel} style={{ color: `${item.level === 10 ? "#FFE500" : "#fff"}` }}>
                    +{item.level}
                </div>
            )}
            {item?.stats?.power !== undefined && (
                <p className={styles.powerLevel}><img src={powerIconImg.src} />{item.stats.power}</p>
            )}
            <div className={styles.hoverContainer}>
                <div className={styles.topRight}></div>
                <div className={styles.bottomLeft}></div>
                <div className={styles.topLeft}></div>
                <div className={styles.bottomRight}></div>
            </div>
        </div>
    )
}
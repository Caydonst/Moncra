import styles from "./newInventory.module.css"
import powerIconImg from "../../assets/misc/power_icon.png"
import { Armor, Weapon } from "../../items/ItemTypes";
import { colors } from "../../utils/uiUtils";
import plusIcon from "../../assets/icons/plus_icon.png"
import upgradeIcon from "@/app/game/assets/icons/upgrade_button_icon.png"

type Props = {
    slot: any;
    equipItem: (item: Weapon | Armor | null) => void;
    type: string;
    setSelectedItem: React.Dispatch<React.SetStateAction<any>>;
    setItemInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showItemTooltip: (item: Weapon | Armor, e: React.MouseEvent) => void;
    moveItemTooltip: (e: React.MouseEvent) => void;
    hideItemTooltip: () => void;
}

export default function ExtraSlot({ slot, equipItem, type, setSelectedItem, setItemInfoOpen, showItemTooltip, moveItemTooltip, hideItemTooltip }: Props) {
    return (
        type === "Weapon" ? (
            <div className={styles.weaponSlotExtras}>
                {slot.extras.map((_, extraIndex) => {
                    const extraItem = slot.extras[extraIndex];

                    return (
                        <div key={extraIndex} 
                        className={styles.extraSlot} 
                        onClick={async () => {
                            await equipItem(extraItem);
                        }} style={{
                            background: `${colors[extraItem?.rarity]?.hex ?? "transparent"}`,
                            borderColor: `${colors[extraItem?.rarity]?.hex ?? "#202020"}`
                        }}
                        onMouseEnter={(e) => showItemTooltip(extraItem, e)}
                        onMouseMove={moveItemTooltip}
                        onMouseLeave={hideItemTooltip}
                        onContextMenu={(e) => {
                            e.preventDefault(); // Prevent browser context menu
                            setSelectedItem(extraItem)
                            setItemInfoOpen(true);
                            hideItemTooltip();
                        }}>
                            {extraItem && (
                                <div className={styles.gearSlotIconContainer}>
                                    {extraItem.type === "Weapon" ? (
                                        <img src={extraItem.icon} className={styles.gearWeaponImg} />
                                    ) : (
                                        <img src={extraItem.icon} className={styles.gearOtherImg} />
                                    )}
                                </div>
                            )}
                            <div className={styles.weaponXpContainer}>
                                <div className={styles.weaponXp} style={{ width: `${(extraItem.currentXp / extraItem.nextLvlXp) * 100}%` }}></div>
                            </div>
                            {extraItem.availableUpgradePoints !== 0 && (
                                <div className={styles.levelAvailableContainer}>
                                    <img src={upgradeIcon.src} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className={styles.armorSlotExtras}>
                {slot.extras.map((_, extraIndex) => {
                    const extraItem = slot.extras[extraIndex];

                    return (
                        <div key={extraIndex} className={styles.extraSlot} 
                        onClick={async () => {
                            await equipItem(extraItem);
                        }} 
                        style={{
                            background: `${colors[extraItem?.rarity]?.hex ?? "#080808"}`,
                            borderColor: `${colors[extraItem?.rarity]?.hex ?? "#202020"
                                }`
                        }}
                        onMouseEnter={(e) => showItemTooltip(extraItem, e)}
                        onMouseMove={moveItemTooltip}
                        onMouseLeave={hideItemTooltip}
                        onContextMenu={(e) => {
                            e.preventDefault(); // Prevent browser context menu
                            setSelectedItem(extraItem)
                            setItemInfoOpen(true);
                            hideItemTooltip();
                        }}
                        >
                            {extraItem && (
                                <div className={styles.gearSlotIconContainer}>
                                    {extraItem.type === "Weapon" ? (
                                        <img src={extraItem.icon} className={styles.gearWeaponImg} />
                                    ) : (
                                        <img src={extraItem.icon} className={styles.gearOtherImg} />
                                    )}
                                </div>
                            )}
                            <div className={styles.weaponXpContainer}>
                                <div className={styles.weaponXp} style={{ width: `${(extraItem.currentXp / extraItem.nextLvlXp) * 100}%` }}></div>
                            </div>
                            {extraItem.availableUpgradePoints > 0 && (
                                <div className={styles.levelAvailableContainer}>
                                    <img src={upgradeIcon.src} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )
        
    )
}
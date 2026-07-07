import styles from "./newInventory.module.css"
import { colors } from "../../utils/uiUtils"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import critIcon from "../../assets/icons/crit_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import armorStatIcon from "../../assets/icons/armor_stat_icon.png"

type Props = {
    selectedItem: any;
    itemInfoOpen: boolean;
    inventoryOpen: boolean;
}

export default function ItemInfoPanel({ selectedItem, itemInfoOpen, inventoryOpen }: Props) {
    return (
        <div className={itemInfoOpen ? `${styles.itemInfoPanel} ${styles.open}` : styles.itemInfoPanel}>
            {selectedItem && (
                <div className={styles.itemInfoContainer}>
                    <div className={styles.nameContainer}>
                        <div className={styles.itemInfoHeader}>
                            <div className={styles.itemInfoHeaderIcon} 
                            style={{
                                background: `${colors[selectedItem?.rarity]?.rgba ?? "#080808"}`,
                                borderColor: `${colors[selectedItem?.rarity]?.hex ?? "#202020"
                                    }`
                            }}>
                                <img src={selectedItem.icon} />
                            </div>
                            <div>
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
                            </div>
                        </div>
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
                    
                    <div className={styles.itemIconContainer}>
                        {selectedItem && (
                            <>
                                <img src={selectedItem.icon} className={styles.selectedOtherImg} />
                                <div className={styles.bgLight} style={{ background: `${colors[selectedItem.rarity]?.hex}` }}></div>
                            </>
                        )}
                    </div>
                    
                </div>
            )}
        </div>
    )
}
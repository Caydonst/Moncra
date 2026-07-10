import styles from "./newInventory.module.css"
import { colors } from "../../utils/uiUtils"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import critIcon from "../../assets/icons/crit_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import armorStatIcon from "../../assets/icons/armor_stat_icon.png"
import { useEffect, useState } from "react"
import PointUpgrader from "./pointUpgrader"

type Props = {
    selectedItem: any;
    itemInfoOpen: boolean;
    inventoryOpen: boolean;
}

type StatPoints = {
    damage: number;
    crit: number;
    hp: number;
    armor: number;
};

export default function ItemInfoPanel({ selectedItem, itemInfoOpen, inventoryOpen }: Props) {
    const [upgradePoints, setUpgradePoints] = useState(selectedItem?.upgradePoints);
    const [statPoints, setStatPoints] = useState<StatPoints>({
        damage: 0,
        crit: 0,
        hp: 0,
        armor: 0,
    });

    function getRollColor(percentage: number) {

        if (percentage >= 100) return "#32FFFF";
        if (percentage >= 90) return "#ea00ff";
        if (percentage >= 65) return "#76FF32";
        if (percentage >= 45) return "#FFE032";
        if (percentage >= 20) return "#FF8C32";
        if (percentage < 20) return "#E53935";
    }

    useEffect(() => {
        setUpgradePoints(selectedItem?.upgradePoints ?? 0);

        setStatPoints({
            damage: selectedItem?.upgradedStats?.damagePoints ?? 0,
            crit: selectedItem?.upgradedStats?.critPoints ?? 0,
            hp: selectedItem?.upgradedStats?.hpPoints ?? 0,
            armor: selectedItem?.upgradedStats?.armorPoints ?? 0,
        });
    }, [selectedItem]);

    type UpgradeableStat = keyof StatPoints;

    function setPointsForStat(
        stat: UpgradeableStat,
        value: React.SetStateAction<number>
    ) {
        setStatPoints(previous => {
            const nextValue =
                typeof value === "function"
                    ? value(previous[stat])
                    : value;

            return {
                ...previous,
                [stat]: nextValue,
            };
        });
    }

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
                            <p className={styles.weaponTypeName}>{selectedItem.kind.charAt(0).toUpperCase() + selectedItem.kind.slice(1)}</p>
                        </div>
                        <div className={styles.itemStatsContainer}>
                            {selectedItem?.level !== undefined && (
                                <div className={styles.selectedWeaponLevel} style={{ color: `${selectedItem?.level === 10 ? "#FFE500" : "#fff"}` }}>
                                    <p>Level {selectedItem?.level}</p>
                                    {upgradePoints > 0 && (
                                        <div className={styles.upgradePointsNotif}>
                                            <h3>i</h3>
                                            <p>{upgradePoints} upgrade points available!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedItem.stats?.damage && (
                                <>
                                    <div className={styles.statContainer}>
                                        <img src={damageIcon.src} className={styles.damageIcon} />
                                        <div className={styles.statMeter} style={{ outline: `${selectedItem?.stats?.rollPercentage.damage === 100 ? "2px solid #FFE900" : ""}` }}>
                                            <div
                                                className={styles.percentage}
                                                style={{
                                                    width: `${selectedItem?.stats?.rollPercentage.damage}%`,
                                                    background: getRollColor(
                                                        selectedItem?.stats?.rollPercentage.damage
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div className={styles.tooltipStatPercentage}>
                                            <p>{selectedItem?.stats.damage}</p>
                                            <p style={{ color: getRollColor(selectedItem?.stats?.rollPercentage.damage) }}>{selectedItem?.stats?.rollPercentage.damage}%</p>
                                        </div>
                                        <PointUpgrader
                                            statPoints={statPoints.damage}
                                            minimumPoints={selectedItem?.upgradedStats?.damagePoints ?? 0}
                                            upgradePoints={upgradePoints}
                                            onChange={(newDamagePoints, newUpgradePoints) => {
                                                setStatPoints(previous => ({
                                                    ...previous,
                                                    damage: newDamagePoints,
                                                }));

                                                setUpgradePoints(newUpgradePoints);
                                            }}
                                        />
                                    </div>
                                    <div className={styles.statContainer}>
                                        <img src={critIcon.src} className={styles.damageIcon} />
                                        <div className={styles.statMeter} style={{ outline: `${selectedItem?.stats?.rollPercentage.crit === 100 ? "2px solid #FFE900" : ""}` }}>
                                            <div
                                                className={styles.percentage}
                                                style={{
                                                    width: `${selectedItem?.stats?.rollPercentage.crit}%`,
                                                    background: getRollColor(
                                                        selectedItem?.stats?.rollPercentage.crit
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div className={styles.tooltipStatPercentage}>
                                            <p>{selectedItem?.stats.crit}</p>
                                            <p style={{ color: getRollColor(selectedItem?.stats?.rollPercentage.crit) }}>{selectedItem?.stats?.rollPercentage.crit}%</p>
                                        </div>
                                        <PointUpgrader
                                            statPoints={statPoints.crit}
                                            minimumPoints={selectedItem?.upgradedStats?.critPoints ?? 0}
                                            upgradePoints={upgradePoints}
                                            onChange={(newCritPoints, newUpgradePoints) => {
                                                setStatPoints(previous => ({
                                                    ...previous,
                                                    crit: newCritPoints,
                                                }));

                                                setUpgradePoints(newUpgradePoints);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                            {selectedItem.stats?.hp && (
                                <>
                                    <div className={styles.statContainer}>
                                        <img src={hpIcon.src} className={styles.hpIcon} />
                                        <div className={styles.statMeter} style={{ outline: `${selectedItem?.stats?.rollPercentage.hp === 100 ? "2px solid #FFE900" : ""}` }}>
                                            <div
                                                className={styles.percentage}
                                                style={{
                                                    width: `${selectedItem?.stats?.rollPercentage.hp}%`,
                                                    background: getRollColor(
                                                        selectedItem?.stats?.rollPercentage.hp
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div className={styles.tooltipStatPercentage}>
                                            <p>{selectedItem?.stats.hp}</p>
                                            <p style={{ color: getRollColor(selectedItem?.stats?.rollPercentage.hp) }}>{selectedItem?.stats?.rollPercentage.hp}%</p>
                                        </div>
                                    </div>
                                    <div className={styles.statContainer}>
                                        <img src={armorStatIcon.src} className={styles.hpIcon} />
                                        <div className={styles.statMeter} style={{ outline: `${selectedItem?.stats?.rollPercentage.armor === 100 ? "2px solid #FFE900" : ""}` }}>
                                            <div
                                                className={styles.percentage}
                                                style={{
                                                    width: `${selectedItem?.stats?.rollPercentage.armor}%`,
                                                    background: getRollColor(
                                                        selectedItem?.stats?.rollPercentage.armor
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div className={styles.tooltipStatPercentage}>
                                            <p>{selectedItem?.stats.armor}</p>
                                            <p style={{ color: getRollColor(selectedItem?.stats?.rollPercentage.armor) }}>{selectedItem?.stats?.rollPercentage.armor}%</p>
                                        </div>
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
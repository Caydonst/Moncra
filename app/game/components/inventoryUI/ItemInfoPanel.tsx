import styles from "./newInventory.module.css"
import { colors } from "../../utils/uiUtils"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import critIcon from "../../assets/icons/crit_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import armorStatIcon from "../../assets/icons/armor_stat_icon.png"
import { useEffect, useState } from "react"
import PointUpgrader from "./pointUpgrader"
import PointsAvailableIcon from "../../assets/icons/points_available_icon.png"
import { upgradeNumbers } from "../../utils/uiUtils"

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
    const [upgradePoints, setUpgradePoints] = useState(selectedItem?.availableUpgradePoints);
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
        console.log("SELECTED ITEM:", selectedItem);
        console.log(
            "CURRENT UPGRADE POINTS:",
            selectedItem?.currentUpgradePoints
        );

        setUpgradePoints(selectedItem?.availableUpgradePoints ?? 0);

        setStatPoints({
            damage: selectedItem?.currentUpgradePoints?.damage ?? 0,
            crit: selectedItem?.currentUpgradePoints?.crit ?? 0,
            hp: selectedItem?.currentUpgradePoints?.hp ?? 0,
            armor: selectedItem?.currentUpgradePoints?.armor ?? 0,
        });
    }, [selectedItem]);

    type UpgradeableStat = keyof StatPoints;

    
    async function upgrade(
        stat: keyof StatPoints,
        newValue: number
    ) {
        const { multiplayer } = await import("../../network/multiplayer");

        const updatedStatPoints: StatPoints = {
            ...statPoints,
            [stat]: newValue,
        };

        multiplayer.sendUpgradeItem(
            selectedItem.uid,
            updatedStatPoints
        );
    }

    const stats: UpgradeableStat[] = [
        "damage",
        "crit",
        "hp",
        "armor",
    ];

    const icons: Record<UpgradeableStat, typeof damageIcon> = {
        damage: damageIcon,
        crit: critIcon,
        hp: hpIcon,
        armor: armorStatIcon,
    };

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
                                {selectedItem.type === "Weapon" ? (
                                    <img className={styles.gearWeaponImg} src={selectedItem.icon} />
                                ) : (
                                    <img className={styles.gearOtherImg} src={selectedItem.icon} />
                                )}
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
                                <div className={styles.selectedWeaponLevel} style={{ color: `${selectedItem?.level === 10 ? "#FFD000" : "#fff"}` }}>
                                    <p>Level {selectedItem?.level}</p>
                                    {upgradePoints > 0 && (
                                        <div className={styles.upgradePointsNotif}>
                                            <div className={styles.upgradePointsNotifIcon}>
                                                <img src={PointsAvailableIcon.src} />
                                            </div>
                                            <p>{upgradePoints} upgrade points available!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {stats.map((stat) => {
                                const upgradedStat = selectedItem?.upgradedStats?.[stat];

                                if (upgradedStat === undefined) {
                                    return null;
                                }

                                const percentage = upgradedStat.percentage ?? 0;
                                const value = upgradedStat.value ?? 0;
                                const minimumPoints =
                                    selectedItem?.currentUpgradePoints?.[stat] ?? 0;

                                return (
                                    <div key={stat} className={styles.statWrapper}>
                                        <PointUpgrader
                                            statPoints={statPoints[stat]}
                                            minimumPoints={minimumPoints}
                                            upgradePoints={upgradePoints}
                                            upgrade={(newStatPoints) => {
                                                upgrade(stat, newStatPoints);
                                            }}
                                            statUpgradeLevel={statPoints[stat] + selectedItem.masteryStats[stat].level}
                                        />
                                        {selectedItem.masteryStats[stat].level > 0 && (
                                            <div className={styles.masteryContainer}>
                                                <p className={styles.mastery}>{selectedItem.masteryStats[stat].level} Mastery</p>
                                                <div className={styles.masteryStatsContainer}>
                                                    <p>
                                                        + {selectedItem.masteryStats[stat].value}
                                                        {stat === "crit" ? `% ${stat}` : ` ${stat}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        

                                        <div className={styles.statContainer}>
                                            <img
                                                src={icons[stat].src}
                                                className={styles.damageIcon}
                                            />

                                            <div
                                                className={styles.statMeter}
                                                style={{
                                                    outline:
                                                        percentage === 100
                                                            ? "2px solid #FFE900"
                                                            : undefined,
                                                }}
                                            >
                                                <div
                                                    className={styles.percentage}
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: getRollColor(percentage),
                                                    }}
                                                />
                                                <div className={styles.upgradedPercentage}
                                                    style={{
                                                        width: `${10}%`,
                                                    }}>

                                                </div>
                                            </div>

                                            <div className={styles.tooltipStatPercentage}>
                                                <div className={styles.valueContainer}>
                                                    <p>
                                                        {value}
                                                        {stat === "crit" ? "%" : ""}
                                                    </p>
                                                    
                                                    <p className={styles.upgradedValue}>
                                                        {value + upgradeNumbers[stat]}
                                                        {stat === "crit" ? "%" : ""}
                                                    </p>
                                                </div>

                                                <div className={styles.valueContainer}>
                                                    <p
                                                        style={{
                                                            color: getRollColor(percentage),
                                                        }}
                                                    >
                                                        {percentage}%
                                                    </p>
                                                    
                                                    <p className={styles.upgradedValue}>
                                                        {percentage + 10}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
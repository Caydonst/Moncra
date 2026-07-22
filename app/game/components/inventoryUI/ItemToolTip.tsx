import { Armor, Weapon } from "../../items/ItemTypes";
import { colors } from "../../utils/uiUtils";
import styles from "./newInventory.module.css"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import critIcon from "../../assets/icons/crit_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import armorStatIcon from "../../assets/icons/armor_stat_icon.png"
import { useEffect } from "react";

type Props = {
    hoveredItem: Weapon | Armor | null;
    tooltipPos: {x: number, y: number};
    tooltipRef: any;
}

export default function ItemToolTip({ tooltipRef, hoveredItem, tooltipPos }: Props) {

    function getRollColor(percentage: number) {
        if (percentage >= 100) return "#32FFFF";
        if (percentage >= 90) return "#ea00ff";
        if (percentage >= 65) return "#76FF32";
        if (percentage >= 45) return "#FFE032";
        if (percentage >= 20) return "#FF8C32";
        if (percentage < 20) return "#E53935";
    }

    const stats = [
        "damage",
        "crit",
        "hp",
        "armor",
    ]

    const icons = {
        "damage": damageIcon,
        "crit": critIcon,
        "hp": hpIcon,
        "armor": armorStatIcon
    }

    return (
        <div
            ref={tooltipRef}
            className={styles.itemTooltip}
            style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                borderColor: `${colors[hoveredItem?.rarity]?.hex ?? "transparent"}`
            }}
        >
            <div className={styles.tooltipHeader}>
                <p className={styles.name}>{hoveredItem?.name.toUpperCase()}</p>
                <div className={styles.tooltipItemTypeContainer}>
                    <p>{hoveredItem?.kind.toUpperCase()}</p>
                    <p style={{ color: `${colors[hoveredItem?.rarity]?.hex ?? "#fff"}` }}>{hoveredItem?.rarity.toUpperCase()}</p>
                </div>
            </div>
            <div className={styles.toolTipPowerContainer}>
                <div className={styles.toolTipPowerInner}>
                    <img src={powerIconImg.src} />
                    <p>{hoveredItem?.stats.power}</p>
                </div>
                <div className={styles.divider}></div>
                {hoveredItem?.level !== undefined && (
                    <p>Level {hoveredItem?.level}</p>
                )}
            </div>

            <div className={styles.tooltipStatsContainer}>
                {stats.map(stat => (
                    hoveredItem?.upgradedStats?.[stat] && (
                        <div key={stat} className={styles.tooltipStat}>
                            <img src={icons[stat].src} />
                            <div className={styles.statMeter} style={{ outline: `${hoveredItem?.upgradedStats?.[stat].percentage === 100 ? "2px solid #FFE900" : ""}` }}>
                                <div
                                    className={styles.percentage}
                                    style={{
                                        width: `${hoveredItem?.upgradedStats?.[stat].percentage}%`,
                                        background: getRollColor(
                                            hoveredItem?.upgradedStats?.[stat].percentage
                                        ),
                                    }}
                                />
                            </div>
                            <div className={styles.tooltipStatPercentage}>
                                {stat === "crit" ? (
                                    <p>{hoveredItem?.upgradedStats?.[stat].value}%</p>
                                ) : (
                                        <p>{hoveredItem?.upgradedStats?.[stat].value}</p>
                                )}
                                <p style={{ color: getRollColor(hoveredItem?.upgradedStats?.[stat].percentage) }}>{Math.round(hoveredItem?.upgradedStats?.[stat].percentage)}%</p>
                            </div>
                        </div>
                    )
                    
                ))}
            </div>
        </div>
    )
}
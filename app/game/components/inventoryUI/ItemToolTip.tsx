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
                {hoveredItem?.stats?.damage !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={damageIcon.src} />
                        <div className={styles.statMeter} style={{ outline: `${hoveredItem?.stats?.rollPercentage.damage === 100 ? "2px solid #FFE900" : ""}` }}>
                            <div
                                className={styles.percentage}
                                style={{
                                    width: `${hoveredItem?.stats?.rollPercentage.damage}%`,
                                    background: getRollColor(
                                        hoveredItem?.stats?.rollPercentage.damage
                                    ),
                                }}
                            />
                        </div>
                        <div className={styles.tooltipStatPercentage}>
                            <p>{hoveredItem?.stats.damage}</p>
                            <p style={{ color: getRollColor(hoveredItem?.stats?.rollPercentage.damage) }}>{hoveredItem?.stats?.rollPercentage.damage}%</p>
                        </div>
                    </div>
                )}

                {hoveredItem?.stats?.crit !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={critIcon.src} />
                        <div className={styles.statMeter} style={{ outline: `${hoveredItem?.stats?.rollPercentage.crit === 100 ? "2px solid #FFE900" : ""}` }}>
                            <div
                                className={styles.percentage}
                                style={{
                                    width: `${hoveredItem?.stats?.rollPercentage.crit}%`,
                                    background: getRollColor(
                                        hoveredItem?.stats?.rollPercentage.crit
                                    ),
                                }}
                            />
                        </div>
                        <div className={styles.tooltipStatPercentage}>
                            <p>{hoveredItem?.stats.crit}%</p>
                            <p style={{ color: getRollColor(hoveredItem?.stats?.rollPercentage.crit) }}>{hoveredItem?.stats?.rollPercentage.crit}%</p>
                        </div>
                    </div>
                )}

                {hoveredItem?.stats?.hp !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={hpIcon.src} />
                        <div className={styles.statMeter} style={{ outline: `${hoveredItem?.stats?.rollPercentage.hp === 100 ? "2px solid #FFE900" : ""}` }}>
                            <div
                                className={styles.percentage}
                                style={{
                                    width: `${hoveredItem?.stats?.rollPercentage.hp}%`,
                                    background: getRollColor(
                                        hoveredItem?.stats?.rollPercentage.hp
                                    ),
                                }}
                            />
                        </div>
                        <div className={styles.tooltipStatPercentage}>
                            <p>{hoveredItem?.stats.hp}</p>
                            <p style={{ color: getRollColor(hoveredItem?.stats?.rollPercentage.hp) }}>{hoveredItem?.stats?.rollPercentage.hp}%</p>
                        </div>
                    </div>
                )}

                {hoveredItem?.stats?.armor !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={armorStatIcon.src} />
                        <div className={styles.statMeter} style={{ outline: `${hoveredItem?.stats?.rollPercentage.armor === 100 ? "2px solid #FFE900" : ""}` }}>
                            <div
                                className={styles.percentage}
                                style={{
                                    width: `${hoveredItem?.stats?.rollPercentage.armor}%`,
                                    background: getRollColor(
                                        hoveredItem?.stats?.rollPercentage.armor
                                    ),
                                }}
                            />
                        </div>
                        <div className={styles.tooltipStatPercentage}>
                            <p>{hoveredItem?.stats.armor}</p>
                            <p style={{ color: getRollColor(hoveredItem?.stats?.rollPercentage.armor) }}>
                                {hoveredItem?.stats?.rollPercentage.armor}%
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
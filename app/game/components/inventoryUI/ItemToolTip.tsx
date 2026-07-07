import { Armor, Weapon } from "../../items/ItemTypes";
import { colors } from "../../utils/uiUtils";
import styles from "./newInventory.module.css"
import powerIconImg from "../../assets/misc/power_icon.png"
import damageIcon from "../../assets/icons/damage_icon.png"
import critIcon from "../../assets/icons/crit_icon.png"
import hpIcon from "../../assets/icons/hp_icon.png"
import armorStatIcon from "../../assets/icons/armor_stat_icon.png"

type Props = {
    hoveredItem: Weapon | Armor | null;
    tooltipPos: {x: number, y: number};
    tooltipRef: any;
}

export default function ItemToolTip({ tooltipRef, hoveredItem, tooltipPos }: Props) {
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
                    <p>{hoveredItem?.type}</p>
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
                        <p>{hoveredItem?.stats.damage}</p>
                    </div>
                )}

                {hoveredItem?.stats?.crit !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={critIcon.src} />
                        <p>{hoveredItem?.stats.damage}</p>
                    </div>
                )}

                {hoveredItem?.stats?.hp !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={hpIcon.src} />
                        <p>{hoveredItem?.stats.damage}</p>
                    </div>
                )}

                {hoveredItem?.stats?.armor !== undefined && (
                    <div className={styles.tooltipStat}>
                        <img src={armorStatIcon.src} />
                        <p>{hoveredItem?.stats.damage}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
import styles from "./newInventory.module.css";
import PlusIcon from "@/app/game/assets/icons/plus_icon.png";
import MinusIcon from "@/app/game/assets/icons/minus_icon.png";
import UpgradeIcon from "@/app/game/assets/icons/upgrade_icon.png";
import UpgradeButtonIcon from "@/app/game/assets/icons/upgrade_button_icon.png";

type Props = {
    statPoints: number;
    minimumPoints: number;
    upgradePoints: number;
    upgrade: (newStatPoints: number) => void;
    statUpgradeLevel: number;
};

export default function PointUpgrader({
    statPoints,
    minimumPoints,
    upgradePoints,
    upgrade,
    statUpgradeLevel,
}: Props) {
    const canAdd = upgradePoints > 0;
    const canSubtract = statPoints > minimumPoints;

    function addPoint() {
        if (!canAdd) return;

        const newStatPoints = statPoints + 1;
        upgrade(newStatPoints);
    }

    function subtractPoint() {
        if (!canSubtract) return;

        const newStatPoints = statPoints - 1;
        upgrade(newStatPoints);
    }

    return (
        <div className={styles.pointUpgraderContainer}>
            <div className={styles.upgradePoints}>
                <img src={UpgradeIcon.src} />
                <p>{statUpgradeLevel}</p>
            </div>
            {upgradePoints > 0 && (
                <div className={styles.pointUpgraderButtons}>
                    <button
                        className={styles.upgradeButton}
                        onClick={addPoint}
                        disabled={!canAdd}
                        aria-label="Add upgrade point"
                    >
                        <img src={UpgradeButtonIcon.src} alt="" />
                    </button>
                </div>
            )}
            
            <button
                className={styles.minusBtn}
                onClick={subtractPoint}
                disabled={!canSubtract}
                aria-label="Remove upgrade point"
            >
                <img src={MinusIcon.src} alt="" />
            </button>
        </div>
    );
}
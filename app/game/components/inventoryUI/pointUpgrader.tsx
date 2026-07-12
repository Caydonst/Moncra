import styles from "./newInventory.module.css";
import PlusIcon from "@/app/game/assets/icons/plus_icon.png";
import MinusIcon from "@/app/game/assets/icons/minus_icon.png";
import UpgradeIcon from "@/app/game/assets/icons/upgrade_icon.png";
import UpgradeButtonIcon from "@/app/game/assets/icons/upgrade_button_icon.png";

type Props = {
    statPoints: number;
    minimumPoints: number;
    upgradePoints: number;
    onChange: (statPoints: number, upgradePoints: number) => void;
    upgrade: (newStatPoints: number) => void;
};

export default function PointUpgrader({
    statPoints,
    minimumPoints,
    upgradePoints,
    onChange,
    upgrade,
}: Props) {
    const canAdd = upgradePoints > 0;
    const canSubtract = statPoints > minimumPoints;

    function addPoint() {
        if (!canAdd) return;

        const newStatPoints = statPoints + 1;
        const newUpgradePoints = upgradePoints - 1;

        onChange(newStatPoints, newUpgradePoints);
        upgrade(newStatPoints);
    }

    function subtractPoint() {
        if (!canSubtract) return;

        const newStatPoints = statPoints - 1;
        const newUpgradePoints = upgradePoints + 1;

        onChange(newStatPoints, newUpgradePoints);
        upgrade(newStatPoints);
    }

    return (
        <div className={styles.pointUpgraderContainer}>
            <div className={styles.upgradePoints}>
                <img src={UpgradeIcon.src} />
                <p>{statPoints}</p>
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
import styles from "./newInventory.module.css";
import PlusIcon from "@/app/game/assets/icons/plus_icon.png";
import MinusIcon from "@/app/game/assets/icons/minus_icon.png";

type Props = {
    statPoints: number;
    minimumPoints: number;
    upgradePoints: number;
    onChange: (statPoints: number, upgradePoints: number) => void;
};

export default function PointUpgrader({
    statPoints,
    minimumPoints,
    upgradePoints,
    onChange,
}: Props) {
    const canAdd = upgradePoints > 0;
    const canSubtract = statPoints > minimumPoints;

    function addPoint() {
        if (!canAdd) return;

        onChange(statPoints + 1, upgradePoints - 1);
    }

    function subtractPoint() {
        if (!canSubtract) return;

        onChange(statPoints - 1, upgradePoints + 1);
    }

    return (
        <div className={styles.pointUpgraderContainer}>
            <p>{statPoints}</p>

            <div className={styles.pointUpgraderButtons}>
                <button
                    type="button"
                    onClick={subtractPoint}
                    disabled={!canSubtract}
                    aria-label="Remove upgrade point"
                >
                    <img src={MinusIcon.src} alt="" />
                </button>

                <button
                    type="button"
                    onClick={addPoint}
                    disabled={!canAdd}
                    aria-label="Add upgrade point"
                >
                    <img src={PlusIcon.src} alt="" />
                </button>
            </div>
        </div>
    );
}
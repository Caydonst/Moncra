import styles from "./newInventory.module.css"
import PlusIcon from "@/app/game/assets/icons/plus_icon.png"
import MinusIcon from "@/app/game/assets/icons/minus_icon.png"

type Props = {
    pointAmt: number;
    availablePoints: number;
    upgradePoints: number;
    setUpgradePoints: React.Dispatch<React.SetStateAction<number>>;
}

export default function PointUpgrader({ pointAmt, availablePoints, upgradePoints, setUpgradePoints }: Props) {

    function addPoints() {
        console.log("Adding points")
        if (upgradePoints > 0) {
            
            pointAmt += 1;
            setUpgradePoints(prev => prev - 1)
        }
    }

    function subtractPoints() {
        console.log("subtracting points")
        if (upgradePoints < availablePoints) {
            pointAmt -= 1;
            setUpgradePoints(prev => prev + 1)
        }
    }

    return (
        <div className={styles.pointUpgraderContainer}>
            <p>{pointAmt}</p>
            <div className={styles.pointUpgraderButtons}>
                <button onClick={subtractPoints}><img src={MinusIcon.src} /></button>
                <button onClick={addPoints}><img src={PlusIcon.src} /></button>
            </div>
        </div>
    )
}
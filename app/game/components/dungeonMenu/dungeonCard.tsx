import styles from "./dungeon.module.css"
import { changeScene } from "../../utils/sceneChanges"
import DungeonImg from "../../assets/misc/dungeon_level5.png"
import { colors, type Dungeon } from "./dungeonInfo";
import { enterDungeon } from "../../utils/sceneTransition";

type Props = {
    scene: ex.Scene | null;
    setDungeonMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    dungeon: Dungeon;
}

export default function DungeonCard({ scene, setDungeonMenuOpen, dungeon }: Props) {
    return (
        <div className={styles.dungeonMenuContainer}>
            <div className={styles.bgLight} style={{ background: `${colors[dungeon.difficulty].hex}` }}></div>
            <div className={styles.dungeonMenuContent}>
                <div className={styles.title}>
                    <div className={styles.dungeonIconContainer} style={{ borderColor: `${colors[dungeon.difficulty.toLowerCase()].hex}` }}>
                        <img src={dungeon.icon.src} />
                    </div>
                    <div className={styles.titleInner}>
                        <p style={{ color: `${colors[dungeon.difficulty].hex}` }}>{dungeon.difficulty.toUpperCase()}</p>
                        <h3>{dungeon.name.toUpperCase()}</h3>
                    </div>
                </div>
                <p>Enter the dungeon?</p>
                <div className={styles.buttonsContainer}>
                    <button className={styles.enterBtn} onClick={async () => {
                        await enterDungeon(dungeon);
                        setDungeonMenuOpen(false);
                        }}>ENTER DUNGEON</button>
                    <button className={styles.cancelBtn} onClick={() => setDungeonMenuOpen(false)}>CANCEL</button>
                </div>
            </div>
            {/*<div className={styles.dungeonMenuBackground}></div>*/}
        </div>
    )
}
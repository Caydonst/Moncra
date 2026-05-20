import { useEffect, useState } from "react";
import styles from "./page.module.css"
import { GameScene } from "../scenes/GameScene";
import DungeonImg from "../assets/misc/dungeon_icon.png"
import { changeScene } from "../utils/sceneChanges"

export default function DungeonMenu(scene: GameScene | null) {
    const [dungeonMenuOpen, setDungeonMenuOpen] = useState(false);

    useEffect(() => {
        const handler = () => {
            setDungeonMenuOpen(prev => !prev);
        };

        window.addEventListener("dungeon-menu-open", handler);

        return () => {
            window.removeEventListener("dungeon-menu-open", handler);
        };
    }, [scene]);

    return (
        <div className={dungeonMenuOpen ? `${styles.dungeonMenuWrapper} ${styles.open}` : styles.dungeonMenuWrapper}>
            <div className={styles.dungeonMenuOuter}>
                <div className={styles.dungeonMenuContainer}>
                    <div className={styles.dungeonMenuContent}>
                        <div className={styles.title}>
                            <div className={styles.dungeonIconContainer}>
                                <img src={DungeonImg.src} />
                            </div>
                            <h3>DUNGEON</h3>
                        </div>
                        <p>Enter the dungeon?</p>
                        <div className={styles.buttonsContainer}>
                            <button className={styles.enterBtn} onClick={() => {
                                changeScene("dungeon")
                                setDungeonMenuOpen(false);
                                }}>ENTER DUNGEON</button>
                            <button className={styles.cancelBtn} onClick={() => setDungeonMenuOpen(false)}>CANCEL</button>
                        </div>
                    </div>
                    {/*<div className={styles.dungeonMenuBackground}></div>*/}
                </div>
            </div>
        </div>
    )
}
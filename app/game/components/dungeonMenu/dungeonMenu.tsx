import { useEffect, useState } from "react";
import styles from "./dungeon.module.css"
import { GameScene } from "../../scenes/GameScene";
import DungeonImg from "../../assets/misc/dungeon_level5.png"
import { changeScene } from "../../utils/sceneChanges"
import DungeonCard from "./dungeonCard";
import DungeonList from "./dungeonInfo"

export default function DungeonMenu(scene: ex.Scene | null) {
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
                {DungeonList.map((dungeon, i) => (
                    <DungeonCard key={i} scene={scene} setDungeonMenuOpen={setDungeonMenuOpen} dungeon={dungeon} />
                ))}
            </div>
        </div>
    )
}
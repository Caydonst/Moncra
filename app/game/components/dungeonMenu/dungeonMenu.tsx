import { useEffect, useState } from "react";
import styles from "./dungeon.module.css"
import { GameScene } from "../../scenes/GameScene";
import DungeonImg from "../../assets/misc/dungeon_level5.png"
import { changeScene } from "../../utils/sceneChanges"
import DungeonCard from "./dungeonCard";
import DungeonList, { colors } from "./dungeonInfo"

export default function DungeonMenu(scene: ex.Scene | null) {
    const [dungeonMenuOpen, setDungeonMenuOpen] = useState(false);
    const [selected, setSelected] = useState(DungeonList[0]);
    const [selectedIndex, setSelectedIndex] = useState(0);

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
                <div className={styles.dungeonSelector}>
                    {DungeonList.map((dungeon, i) => (
                        <button 
                        key={i}
                        className={`${styles.selectorBtn} ${selectedIndex === i ? styles.selected : ""}`}
                        style={{ color: `${selectedIndex === i ? colors[dungeon.difficulty.toLowerCase()].hex : "#c9c9c9"}`, borderColor: `${selectedIndex === i ? colors[dungeon.difficulty].hex : "transparent"}` }}
                        onClick={() => {setSelected(dungeon); setSelectedIndex(i);}}
                        >
                            <img src={dungeon.icon.src} />
                            {dungeon.difficulty.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className={styles.dungeonContentContainer}>
                    <DungeonCard scene={scene} setDungeonMenuOpen={setDungeonMenuOpen} dungeon={selected} />
                </div>
            </div>
        </div>
    )
}
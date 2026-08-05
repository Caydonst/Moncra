import { useEffect, useState } from "react";
import styles from "./dungeonMenu.module.css"
import { GameScene } from "../../../scenes/GameScene";
import DungeonImg from "../../assets/misc/dungeon_level5.png"
import { changeScene } from "../../../utils/sceneChanges"
import DungeonCard from "../dungeonCard";
import DungeonList, { colors } from "../dungeonInfo"

type Props = {
    scene: ex.Scene | null;
    setDungeonMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DungeonMenu({ scene, setDungeonMenuOpen }: Props) {
    const [selected, setSelected] = useState(DungeonList[0]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [tabSelected, setTabSelected] = useState("dungeon");

    return (
        <div className={styles.dungeonMain}>
            <div className={styles.dungeonSelector}>
                {DungeonList.map((dungeon, i) => (
                    <button
                        key={i}
                        className={`${styles.selectorBtn} ${selectedIndex === i ? styles.selected : ""}`}
                        style={{
                            color: selectedIndex === i
                                ? colors[dungeon.difficulty].hex
                                : "#c9c9c9",

                            borderColor: selectedIndex === i
                                ? colors[dungeon.difficulty].hex
                                : "transparent",

                            background: selectedIndex === i
                                ? colors[dungeon.difficulty].rgba
                                : "transparent",
                        }}
                        onClick={() => { setSelected(dungeon); setSelectedIndex(i); }}
                    >
                        <div className={styles.selectorImgContainer}>
                            <img src={dungeon.icon.src} />
                        </div>
                        Floors {dungeon.floors.toUpperCase()}
                    </button>
                ))}
            </div>
            <div className={styles.dungeonContentContainer}>
                <DungeonCard scene={scene} setDungeonMenuOpen={setDungeonMenuOpen} dungeon={selected} />
            </div>
        </div>
    )
}
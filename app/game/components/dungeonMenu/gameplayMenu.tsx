import { useEffect, useState } from "react";
import styles from "./dungeon.module.css"
import { GameScene } from "../../scenes/GameScene";
import DungeonImg from "../../assets/misc/dungeon_level5.png"
import { changeScene } from "../../utils/sceneChanges"
import DungeonCard from "./dungeonCard";
import DungeonList, { colors } from "./dungeonInfo"
import DungeonMenu from "./DungeonMenu/dungeonMenu";
import PartyMenu from "./PartyMenu/partyMenu";

export default function GameplayMenu(scene: ex.Scene | null) {
    const [dungeonMenuOpen, setDungeonMenuOpen] = useState(false);
    const [selected, setSelected] = useState(DungeonList[0]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [tabSelected, setTabSelected] = useState("dungeon");

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
                <div className={styles.dungeonHeader}>
                    <h3>GAMEPLAY MENU</h3>
                    <div className={styles.headerRight}>
                        <button className={tabSelected === "dungeon" ? styles.tabSelected : ""} onClick={() => setTabSelected("dungeon")}>DUNGEON</button>
                        <button className={tabSelected === "party" ? styles.tabSelected : ""} onClick={() => setTabSelected("party")}>PARTY</button>
                    </div>
                </div>
                <div className={styles.main}>
                    {tabSelected === "dungeon" && (
                        <DungeonMenu scene={scene} setDungeonMenuOpen={setDungeonMenuOpen} />
                    )}
                    {tabSelected === "party" && (
                        <PartyMenu />
                    )}
                </div>
            </div>
        </div>
    )
}
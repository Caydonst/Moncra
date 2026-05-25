import styles from "./landing.module.css"
import { changeScene } from "../../utils/sceneChanges"

type Props = {
    game: ex.Engine;
}

export default function LandingPage({ game }: Props) {
    return (
    <div className={styles.landingPageWrapper}>
        <div className={styles.landingPageContainer}>
            <h1>MONCRA</h1>
            <p>A 2D DUNGEON CRAWLER RPG</p>
            <div className={styles.buttonsContainer}>
                <button className={styles.startBtn} onClick={() => changeScene("hub")}>
                    START GAME
                </button>
            </div>
        </div>
    </div>
    )
}
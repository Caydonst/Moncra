import styles from "./page.module.css"

type Props = {
    game: ex.Engine;
    onStart: () => void;
}

export default function LandingPage({ game, onStart }: Props) {
    return (
    <div className={styles.landingPageWrapper}>
        <div className={styles.landingPageContainer}>
            <h1>MONCRA</h1>
            <p>A 2D DUNGEON CRAWLER RPG</p>
            <div className={styles.buttonsContainer}>
                <button className={styles.startBtn} onClick={onStart}>
                    START GAME
                </button>
            </div>
        </div>
    </div>
    )
}
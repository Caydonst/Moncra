import { gameState } from "../../gameState/gameState";
import { disableGameKeyboard, enableGameKeyboard } from "../../utils/inputUtils";
import styles from "./social.module.css"

type Props = {
    socialOpen: boolean;
}

export default function SocialUI({ socialOpen }: Props) {
    return (
        <div data-game-ui className={`${styles.socialWrapper} ${socialOpen ? styles.open : ""}`}>
            <div className={styles.header}>
                <p className={styles.title}>Social</p>
            </div>
            <div className={styles.searchContainer}>
                <input 
                type={"text"} 
                placeholder={"Search players"}
                onFocus={disableGameKeyboard}
                onBlur={enableGameKeyboard}
                />
            </div>
        </div>
    )
}
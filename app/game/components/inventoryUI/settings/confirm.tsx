import styles from "./settings.module.css"

type Props = {
    message: string;
    confirmOpen: boolean;
    setConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
    confirmFunction: () => void;
}

export default function Confirm({ message, confirmOpen, setConfirmOpen, confirmFunction }: Props) {
    
    return (
        <div className={`${styles.confirmWrapper} ${confirmOpen ? styles.open : ""}`}>
            <div className={styles.confirmContainer}>
                <p>{message}</p>
                <div className={styles.confirmButtons}>
                    <button className={styles.yesBtn} onClick={() => confirmFunction?.()}>Yes</button>
                    <button className={styles.cancelBtn} onClick={() => setConfirmOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
    )
}
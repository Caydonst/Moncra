import Link from "next/link"
import styles from "./settings.module.css"
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Confirm from "./confirm";

export default function Settings() {
    const [selected, setSelected] = useState("key-mapping");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmFunction, setConfirmFunction] = useState<(() => void) | null>(null);

    async function logout() {
        const supabase = createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Failed to sign out:", error);
            return;
        }

        // Optional: send them back to the login page
        window.location.href = "/";
    }

    function exitGame() {
        window.location.href = "/";
    }

    return (
        <div className={styles.settingsContainer}>
            <div className={styles.settingsNavbar}>
                <div className={styles.navButtons}>
                    <button className={selected === "key-mapping" ? styles.selected : ""} onClick={() => setSelected("key-mapping")}>KEY MAPPING</button>
                </div>
                
                <div className={styles.navFooter}>
                    <button className={styles.exitBtn} onClick={() => {
                        setConfirmMessage("Exit game?");
                        setConfirmOpen(true);
                        setConfirmFunction(() => exitGame);
                    }}>EXIT GAME</button>
                    <button className={styles.logoutBtn} onClick={() => {
                        setConfirmMessage("Log out?");
                        setConfirmOpen(true);
                        setConfirmFunction(() => logout);
                    }}>LOG OUT</button>
                </div>
                
            </div>
            <div className={styles.selectedMainContainer}>
                <div>COMING SOON</div>
            </div>
            <Confirm message={confirmMessage} confirmOpen={confirmOpen} setConfirmOpen={setConfirmOpen} confirmFunction={confirmFunction} />
        </div>
    )
}
// app/components/loggedOutMessage/loggedOutMessage.tsx

"use client";

import { useEffect, useState } from "react";
import styles from "./misc.module.css";
import {XMarkIcon} from "@heroicons/react/24/solid"

export function LoggedOutMessage() {
    const [messageOpen, setMessageOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.get("reason") !== "logged_in_elsewhere") {
            return;
        }

        setMessageOpen(true);

        // Remove the query parameter so refreshing the page
        // does not show the message again.
        const url = new URL(window.location.href);
        url.searchParams.delete("reason");

        window.history.replaceState(
            {},
            "",
            `${url.pathname}${url.search}${url.hash}`
        );
    }, []);

    if (!messageOpen) {
        return null;
    }

    return (
        <div
            className={styles.message}
            role="alert"
            aria-live="assertive"
        >
            <div className={styles.content}>
                <p className={styles.title}>You have been removed from the game.</p>

                <p className={styles.description}>
                    Another user signed into your account.
                </p>
            </div>

            <button
                className={styles.closeButton}
                type="button"
                aria-label="Close message"
                onClick={() => setMessageOpen(false)}
            >
                <XMarkIcon />
            </button>
        </div>
    );
}
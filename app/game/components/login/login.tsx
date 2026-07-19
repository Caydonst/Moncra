"use client";

import {
    useEffect,
    useState,
    type FormEvent,
} from "react";
import styles from "@/app/page.module.css"

import { useAuth } from "@/app/providers/AuthProvider";
import {XMarkIcon} from "@heroicons/react/24/solid"
import { createClient } from "@/lib/supabase/client";

type Props = {
    setLoginOpen: React.Dispatch<React.SetStateAction<boolean>>;
    loginOpen: boolean;
}

export function LoginForm({ setLoginOpen, loginOpen }: Props) {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState<string | null>(null);

    const [submitting, setSubmitting] =
        useState(false);

    useEffect(() => {
        setEmail("");
        setPassword("");
        setError("");
    }, [loginOpen])

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await login({
                email,
                password,
            });

            setLoginOpen(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to log in."
            );
        } finally {
            setSubmitting(false);
        }

        const supabase = createClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Not logged in");
        }
    }

    return (
        <div className={`${styles.loginWrapper} ${loginOpen ? styles.open : ""}`}>
            <form className={styles.loginContainer} onSubmit={handleSubmit}>
                <h1>Login</h1>
                <input
                    type="email"
                    value={email}
                    placeholder="Email"
                    autoComplete="email"
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    required
                />

                <input
                    type="password"
                    value={password}
                    placeholder="Password"
                    autoComplete="current-password"
                    onChange={(event) =>
                        setPassword(
                            event.target.value
                        )
                    }
                    required
                />

                {error && <p>{error}</p>}

                <button
                    className={styles.loginBtn}
                    type="submit"
                    disabled={submitting}
                >
                    {submitting
                        ? "Logging in..."
                        : "Log in"}
                </button>
                <button type={"button"} className={styles.closeBtn} onClick={() => setLoginOpen(false)}><XMarkIcon /></button>
            </form>
        </div>
    );
}
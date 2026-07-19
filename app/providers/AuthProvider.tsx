"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import type {
    Session,
    User,
} from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import {
    login as loginWithPassword,
    logout as logoutFromSupabase,
    register as registerWithPassword,
    type LoginCredentials,
} from "@/lib/auth/authClient";

type AuthContextValue = {
    user: User | null;
    session: Session | null;
    accessToken: string | null;
    loading: boolean;
    login: (
        credentials: LoginCredentials
    ) => Promise<void>;
    register: (
        credentials: LoginCredentials
    ) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext =
    createContext<AuthContextValue | null>(null);

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const supabase = useMemo(
        () => createClient(),
        []
    );

    const [user, setUser] =
        useState<User | null>(null);

    const [session, setSession] =
        useState<Session | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadInitialSession() {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (!mounted) return;

            if (error) {
                console.error(
                    "Failed to load Supabase session:",
                    error
                );

                setSession(null);
                setUser(null);
            } else {
                setSession(session);
                setUser(session?.user ?? null);
            }

            setLoading(false);
        }

        void loadInitialSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    async function login(
        credentials: LoginCredentials
    ) {
        const result =
            await loginWithPassword(credentials);

        setSession(result.session);
        setUser(result.user);
    }

    async function register(
        credentials: LoginCredentials
    ) {
        const result =
            await registerWithPassword(credentials);

        setSession(result.session);
        setUser(result.user);
    }

    async function logout() {
        await logoutFromSupabase();

        setSession(null);
        setUser(null);
    }

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            session,
            accessToken:
                session?.access_token ?? null,
            loading,
            login,
            register,
            logout,
        }),
        [user, session, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}
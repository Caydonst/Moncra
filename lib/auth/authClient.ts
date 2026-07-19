import { createClient } from "@/lib/supabase/client";

export type LoginCredentials = {
    email: string;
    password: string;
};

export async function login({
    email,
    password,
}: LoginCredentials) {
    const supabase = createClient();

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.session || !data.user) {
        throw new Error(
            "Supabase did not return an authenticated session."
        );
    }

    return {
        user: data.user,
        session: data.session,
    };
}

export async function register({
    email,
    password,
}: LoginCredentials) {
    const supabase = createClient();

    const { data, error } =
        await supabase.auth.signUp({
            email: email.trim(),
            password,
        });

    if (error) {
        throw new Error(error.message);
    }

    return {
        user: data.user,
        session: data.session,
    };
}

export async function logout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}
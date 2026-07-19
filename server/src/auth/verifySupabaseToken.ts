import { supabaseAuth } from "../lib/supabase.js";

export type ColyseusAuth = {
    userId: string;
    email?: string;
};

export async function verifySupabaseToken(
    token: string
): Promise<ColyseusAuth | null> {
    if (!token) {
        return null;
    }

    const {
        data: { user },
        error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
        return null;
    }

    return {
        userId: user.id,
        email: user.email,
    };
}
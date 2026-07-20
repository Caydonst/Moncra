// server/src/auth/verifySupabaseToken.ts

import { createClient } from "@supabase/supabase-js";

console.log("Runtime environment:", {
    nodeEnv: process.env.NODE_ENV,
    region: process.env.REGION,
    country: process.env.COUNTRY,
    hasPort: Boolean(process.env.PORT),
    hasClientUrl: Boolean(process.env.CLIENT_URL),
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabasePublishableKey: Boolean(
        process.env.SUPABASE_PUBLISHABLE_KEY
    ),
    availableSupabaseVariables: Object.keys(process.env)
        .filter((key) => key.startsWith("SUPABASE_")),
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
}

if (!supabaseKey) {
    throw new Error(
        "Missing SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY"
    );
}

const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    }
);

export async function verifySupabaseToken(
    accessToken: string
) {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(accessToken);

    if (error) {
        console.error(
            "Supabase token verification failed:",
            {
                message: error.message,
                status: error.status,
                name: error.name,
            }
        );

        return null;
    }

    if (!user) {
        console.error(
            "Supabase token verification returned no user."
        );

        return null;
    }

    return user;
}
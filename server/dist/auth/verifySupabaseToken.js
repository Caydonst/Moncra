// server/src/auth/verifySupabaseToken.ts
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
}
if (!supabaseKey) {
    throw new Error("Missing SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY");
}
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
});
export async function verifySupabaseToken(accessToken) {
    const { data: { user }, error, } = await supabase.auth.getUser(accessToken);
    if (error) {
        console.error("Supabase token verification failed:", {
            message: error.message,
            status: error.status,
            name: error.name,
        });
        return null;
    }
    if (!user) {
        console.error("Supabase token verification returned no user.");
        return null;
    }
    return user;
}
//# sourceMappingURL=verifySupabaseToken.js.map
import { createClient } from "@/lib/supabase/server";
import GameCanvas from "./GameUI/GameCanvas";
import { redirect } from "next/navigation";

export default async function Page() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/");
    }

    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("username")
        .eq("uid", user.id)
        .single();

    if (profileError || !profile) {
        console.error(
            "Failed to load game profile:",
            profileError?.message
        );

        redirect("/");
    }

    return (
        <GameCanvas
            username={profile.username}
        />
    );
}
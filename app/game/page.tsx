import { createClient } from "@/lib/supabase/server";
import GameCanvas from "./GameUI/GameCanvas"
import { redirect } from "next/navigation";

export default async function Page() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    console.log("Game page server user:", user?.id);
    console.log("Game page auth error:", error?.message);

    

    if (!user) {
        redirect("/");
    }
    return (
        <GameCanvas />
    )
}
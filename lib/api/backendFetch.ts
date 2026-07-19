import { createClient } from "@/lib/supabase/client";

const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
    throw new Error(
        "Missing NEXT_PUBLIC_BACKEND_URL"
    );
}

export async function backendFetch(
    path: string,
    options: RequestInit = {}
) {
    const supabase = createClient();

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw new Error(
            `Unable to read session: ${error.message}`
        );
    }

    if (!session?.access_token) {
        throw new Error(
            "You must be logged in."
        );
    }

    const headers = new Headers(
        options.headers
    );

    headers.set(
        "Authorization",
        `Bearer ${session.access_token}`
    );

    if (
        options.body &&
        !headers.has("Content-Type") &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    const response = await fetch(
        `${backendUrl}${path}`,
        {
            ...options,
            headers,
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Your session is invalid or expired."
        );
    }

    return response;
}
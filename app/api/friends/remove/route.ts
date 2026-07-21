import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RemoveFriendBody = {
    friendUid?: string;
};

function orderUserUids(
    firstUid: string,
    secondUid: string
) {
    return firstUid < secondUid
        ? {
            userOneUid: firstUid,
            userTwoUid: secondUid,
        }
        : {
            userOneUid: secondUid,
            userTwoUid: firstUid,
        };
}

export async function DELETE(request: Request) {
    try {
        const body =
            (await request.json()) as RemoveFriendBody;

        const friendUid = body.friendUid?.trim();

        if (!friendUid) {
            return NextResponse.json(
                {
                    error: "Friend UID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                {
                    error: "You must be logged in.",
                },
                {
                    status: 401,
                }
            );
        }

        if (friendUid === user.id) {
            return NextResponse.json(
                {
                    error: "Invalid friend.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            userOneUid,
            userTwoUid,
        } = orderUserUids(
            user.id,
            friendUid
        );

        const {
            data: friendship,
            error: friendshipError,
        } = await supabase
            .from("friends")
            .select("id")
            .eq("user_one_uid", userOneUid)
            .eq("user_two_uid", userTwoUid)
            .maybeSingle();

        if (friendshipError) {
            console.error(
                "Failed to find friendship:",
                friendshipError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to check friendship.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!friendship) {
            return NextResponse.json(
                {
                    error:
                        "This player is not in your friends list.",
                },
                {
                    status: 404,
                }
            );
        }

        const { error: deleteError } =
            await supabase
                .from("friends")
                .delete()
                .eq("id", friendship.id);

        if (deleteError) {
            console.error(
                "Failed to remove friend:",
                deleteError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to remove friend.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Friend removed.",
        });
    } catch (error) {
        console.error(
            "Unexpected remove friend error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong.",
            },
            {
                status: 500,
            }
        );
    }
}
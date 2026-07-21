import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AcceptFriendRequestBody = {
    requestId?: string | number;
};

function orderUserUids(firstUid: string, secondUid: string) {
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

export async function POST(request: Request) {
    try {
        const body =
            (await request.json()) as AcceptFriendRequestBody;

        const requestId = body.requestId;

        if (
            requestId === undefined ||
            requestId === null ||
            requestId === ""
        ) {
            return NextResponse.json(
                {
                    error:
                        "Friend request ID is required.",
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

        const {
            data: friendRequest,
            error: requestError,
        } = await supabase
            .from("friend_requests")
            .select(
                "id, sender_uid, receiver_uid"
            )
            .eq("id", requestId)
            .maybeSingle();

        if (requestError) {
            console.error(
                "Failed to load friend request:",
                requestError
            );

            return NextResponse.json(
                {
                    error: "Failed to load friend request.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!friendRequest) {
            return NextResponse.json(
                {
                    error:
                        "That friend request no longer exists.",
                },
                {
                    status: 404,
                }
            );
        }

        if (
            friendRequest.receiver_uid !== user.id
        ) {
            return NextResponse.json(
                {
                    error:
                        "You cannot accept this friend request.",
                },
                {
                    status: 403,
                }
            );
        }

        const {
            userOneUid,
            userTwoUid,
        } = orderUserUids(
            friendRequest.sender_uid,
            friendRequest.receiver_uid
        );

        const {
            data: existingFriendship,
            error: existingFriendshipError,
        } = await supabase
            .from("friends")
            .select("id")
            .eq("user_one_uid", userOneUid)
            .eq("user_two_uid", userTwoUid)
            .maybeSingle();

        if (existingFriendshipError) {
            console.error(
                "Failed to check friendship:",
                existingFriendshipError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to check existing friendship.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!existingFriendship) {
            const { error: friendshipError } =
                await supabase
                    .from("friends")
                    .insert({
                        user_one_uid:
                            userOneUid,
                        user_two_uid:
                            userTwoUid,
                    });

            if (friendshipError) {
                console.error(
                    "Failed to create friendship:",
                    friendshipError
                );

                return NextResponse.json(
                    {
                        error:
                            friendshipError.message,
                    },
                    {
                        status: 500,
                    }
                );
            }
        }

        const { error: deleteError } =
            await supabase
                .from("friend_requests")
                .delete()
                .eq("id", friendRequest.id);

        if (deleteError) {
            console.error(
                "Friendship created, but request could not be deleted:",
                deleteError
            );

            return NextResponse.json(
                {
                    error:
                        "Friendship was created, but the request could not be removed.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            friendUid:
                friendRequest.sender_uid,
            message:
                "Friend request accepted.",
        });
    } catch (error) {
        console.error(
            "Unexpected accept friend request error:",
            error
        );

        return NextResponse.json(
            {
                error: "Something went wrong.",
            },
            {
                status: 500,
            }
        );
    }
}
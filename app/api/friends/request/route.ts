import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FriendRequestBody = {
    username?: string;
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

export async function POST(request: Request) {
    try {
        const body =
            (await request.json()) as FriendRequestBody;

        const username = body.username?.trim();

        if (!username) {
            return NextResponse.json(
                {
                    error: "Enter a player name.",
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
            data: targetUser,
            error: targetUserError,
        } = await supabase
            .from("users")
            .select("uid, username")
                .ilike("username", username)
            .maybeSingle();

        if (targetUserError) {
            console.error(
                "Failed to find user:",
                targetUserError
            );

            return NextResponse.json(
                {
                    error: "Failed to search for that user.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!targetUser) {
            return NextResponse.json(
                {
                    error: "That user does not exist.",
                },
                {
                    status: 404,
                }
            );
        }

        if (targetUser.uid === user.id) {
            return NextResponse.json(
                {
                    error: "You cannot add yourself.",
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
            targetUser.uid
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
                "Failed to check existing friendship:",
                existingFriendshipError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to check whether this player is already your friend.",
                },
                {
                    status: 500,
                }
            );
        }

        if (existingFriendship) {
            return NextResponse.json(
                {
                    error:
                        "This player is already your friend.",
                },
                {
                    status: 409,
                }
            );
        }

        const {
            data: existingRequest,
            error: existingRequestError,
        } = await supabase
            .from("friend_requests")
            .select(
                "id, sender_uid, receiver_uid"
            )
            .or(
                [
                    `and(sender_uid.eq.${user.id},receiver_uid.eq.${targetUser.uid})`,
                    `and(sender_uid.eq.${targetUser.uid},receiver_uid.eq.${user.id})`,
                ].join(",")
            )
            .maybeSingle();

        if (existingRequestError) {
            console.error(
                "Failed to check existing request:",
                existingRequestError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to check existing friend requests.",
                },
                {
                    status: 500,
                }
            );
        }

        if (existingRequest) {
            const currentUserSentRequest =
                existingRequest.sender_uid === user.id;

            return NextResponse.json(
                {
                    error: currentUserSentRequest
                        ? "You already sent this user a friend request."
                        : "This user has already sent you a friend request.",
                },
                {
                    status: 409,
                }
            );
        }

        const { error: insertError } =
            await supabase
                .from("friend_requests")
                .insert({
                    sender_uid: user.id,
                    receiver_uid: targetUser.uid,
                });

        if (insertError) {
            console.error(
                "Failed to create friend request:",
                insertError
            );

            if (insertError.code === "23505") {
                return NextResponse.json(
                    {
                        error:
                            "A friend request already exists.",
                    },
                    {
                        status: 409,
                    }
                );
            }

            return NextResponse.json(
                {
                    error: "Failed to send friend request.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Friend request sent to ${targetUser.username}.`,
        });
    } catch (error) {
        console.error(
            "Unexpected friend request error:",
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

type FriendRequestRow = {
    id: number;
    sender_uid: string;
    created_at: string;
};

type UserRow = {
    uid: string;
    username: string;
};

export async function GET() {
    try {
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

        // First query: get all incoming requests.
        const {
            data: requestRows,
            error: requestsError,
        } = await supabase
            .from("friend_requests")
            .select(
                "id, sender_uid, created_at"
            )
            .eq("receiver_uid", user.id)
            .order("created_at", {
                ascending: false,
            });

        if (requestsError) {
            console.error(
                "Failed to load friend requests:",
                {
                    message: requestsError.message,
                    code: requestsError.code,
                    details: requestsError.details,
                    hint: requestsError.hint,
                }
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to load friend requests.",
                },
                {
                    status: 500,
                }
            );
        }

        const friendRequests =
            (requestRows ?? []) as FriendRequestRow[];

        // No requests means there is no reason
        // to query the users table.
        if (friendRequests.length === 0) {
            return NextResponse.json({
                requests: [],
            });
        }

        // Get every unique sender UID.
        const senderUids = [
            ...new Set(
                friendRequests.map(
                    (request) =>
                        request.sender_uid
                )
            ),
        ];

        // Second query: find the users whose UIDs
        // match the request senders.
        const {
            data: userRows,
            error: usersError,
        } = await supabase
            .from("users")
            .select("uid, username")
            .in("uid", senderUids);

        if (usersError) {
            console.error(
                "Failed to load request senders:",
                {
                    message: usersError.message,
                    code: usersError.code,
                    details: usersError.details,
                    hint: usersError.hint,
                }
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to load request senders.",
                },
                {
                    status: 500,
                }
            );
        }

        const senders =
            (userRows ?? []) as UserRow[];

        // Build a lookup so each request can quickly
        // find its sender's username.
        const usernamesByUid = new Map(
            senders.map((sender) => [
                sender.uid,
                sender.username,
            ])
        );

        const requests = friendRequests.map(
            (request) => ({
                id: request.id,
                senderId:
                    request.sender_uid,
                username:
                    usernamesByUid.get(
                        request.sender_uid
                    ) ?? "Unknown player",
                createdAt:
                    request.created_at,
            })
        );

        return NextResponse.json({
            requests,
        });
    } catch (error) {
        console.error(
            "Unexpected friend request error:",
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
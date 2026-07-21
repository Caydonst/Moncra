import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FriendshipRow = {
    id: string;
    user_one_uid: string;
    user_two_uid: string;
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

        const {
            data: friendshipRows,
            error: friendshipsError,
        } = await supabase
            .from("friends")
            .select(
                "id, user_one_uid, user_two_uid, created_at"
            )
            .or(
                `user_one_uid.eq.${user.id},user_two_uid.eq.${user.id}`
            )
            .order("created_at", {
                ascending: false,
            });

        if (friendshipsError) {
            console.error(
                "Failed to load friendships:",
                friendshipsError
            );

            return NextResponse.json(
                {
                    error: "Failed to load friends.",
                },
                {
                    status: 500,
                }
            );
        }

        const friendships =
            (friendshipRows ??
                []) as FriendshipRow[];

        if (friendships.length === 0) {
            return NextResponse.json({
                friends: [],
            });
        }

        const friendUids = [
            ...new Set(
                friendships.map(
                    (friendship) =>
                        friendship.user_one_uid ===
                            user.id
                            ? friendship.user_two_uid
                            : friendship.user_one_uid
                )
            ),
        ];

        const {
            data: userRows,
            error: usersError,
        } = await supabase
            .from("users")
            .select("uid, username")
            .in("uid", friendUids);

        if (usersError) {
            console.error(
                "Failed to load friend users:",
                usersError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to load friend information.",
                },
                {
                    status: 500,
                }
            );
        }

        const users =
            (userRows ?? []) as UserRow[];

        const usersByUid = new Map(
            users.map((friend) => [
                friend.uid,
                friend,
            ])
        );

        const friends = friendships.map(
            (friendship) => {
                const friendUid =
                    friendship.user_one_uid ===
                        user.id
                        ? friendship.user_two_uid
                        : friendship.user_one_uid;

                const friend =
                    usersByUid.get(friendUid);

                return {
                    friendshipId:
                        friendship.id,
                    uid: friendUid,
                    username:
                        friend?.username ??
                        "Unknown player",
                    friendsSince:
                        friendship.created_at,
                };
            }
        );

        return NextResponse.json({
            friends,
        });
    } catch (error) {
        console.error(
            "Unexpected friends loading error:",
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
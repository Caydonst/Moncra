import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DeclineFriendRequestBody = {
    requestId?: string | number;
};

export async function DELETE(request: Request) {
    try {
        const body =
            (await request.json()) as DeclineFriendRequestBody;

        const requestId = body.requestId;

        if (
            requestId === undefined ||
            requestId === null ||
            requestId === ""
        ) {
            return NextResponse.json(
                {
                    error: "Friend request ID is required.",
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
                    error:
                        "Failed to load friend request.",
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
                        "You cannot decline this friend request.",
                },
                {
                    status: 403,
                }
            );
        }

        const { error: deleteError } =
            await supabase
                .from("friend_requests")
                .delete()
                .eq("id", friendRequest.id);

        if (deleteError) {
            console.error(
                "Failed to decline friend request:",
                deleteError
            );

            return NextResponse.json(
                {
                    error:
                        "Failed to decline friend request.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Friend request declined.",
        });
    } catch (error) {
        console.error(
            "Unexpected decline friend request error:",
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
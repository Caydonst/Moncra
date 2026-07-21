import { useEffect, useState } from "react";
import {
    disableGameKeyboard,
    enableGameKeyboard,
} from "../../utils/inputUtils";
import styles from "./social.module.css";
import { XMarkIcon } from "@heroicons/react/24/outline";
import FriendsIcon from "@/app/game/assets/icons/friends_icon.png"
import PendingIcon from "@/app/game/assets/icons/add_friend_icon.png"

type Props = {
    socialOpen: boolean;
    setSocialOpen: React.Dispatch<
        React.SetStateAction<boolean>
    >;
};

type RequestStatus = {
    type: "success" | "error";
    message: string;
} | null;

type FriendRequest = {
    id: number;
    senderId: string;
    username: string;
    createdAt: string;
};

type Friend = {
    friendshipId: string;
    uid: string;
    username: string;
    friendsSince: string;
};

type SocialSection =
    | "friends"
    | "pending";

export default function SocialUI({
    socialOpen,
    setSocialOpen,
}: Props) {
    const [playerName, setPlayerName] =
        useState("");

    const [sendingRequest, setSendingRequest] =
        useState(false);

    const [requestStatus, setRequestStatus] =
        useState<RequestStatus>(null);

    const [activeSection, setActiveSection] =
        useState<SocialSection>("friends");

    const [friendRequests, setFriendRequests] =
        useState<FriendRequest[]>([]);

    const [loadingRequests, setLoadingRequests] =
        useState(false);

    const [requestsError, setRequestsError] =
        useState<string | null>(null);

    const [friends, setFriends] =
        useState<Friend[]>([]);

    const [loadingFriends, setLoadingFriends] =
        useState(false);

    const [friendsError, setFriendsError] =
        useState<string | null>(null);

    const [
        acceptingRequestId,
        setAcceptingRequestId,
    ] = useState<number | null>(null);

    async function loadFriends() {
        setLoadingFriends(true);
        setFriendsError(null);

        try {
            const response = await fetch(
                "/api/friends",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const data = (await response.json()) as {
                friends?: Friend[];
                error?: string;
            };

            if (!response.ok) {
                setFriendsError(
                    data.error ??
                    "Failed to load friends."
                );

                return;
            }

            setFriends(data.friends ?? []);
        } catch (error) {
            console.error(
                "Failed to load friends:",
                error
            );

            setFriendsError(
                "Could not connect to the server."
            );
        } finally {
            setLoadingFriends(false);
        }
    }

    async function loadFriendRequests() {
        if (loadingRequests) {
            return;
        }

        setLoadingRequests(true);
        setRequestsError(null);

        try {
            const response = await fetch(
                "/api/friends/request",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const data = (await response.json()) as {
                requests?: FriendRequest[];
                error?: string;
            };

            if (!response.ok) {
                setRequestsError(
                    data.error ??
                    "Failed to load friend requests."
                );
                return;
            }

            setFriendRequests(
                data.requests ?? []
            );
        } catch (error) {
            console.error(
                "Failed to load friend requests:",
                error
            );

            setRequestsError(
                "Could not connect to the server."
            );
        } finally {
            setLoadingRequests(false);
        }
    }

    async function addFriend() {
        const username = playerName.trim();

        if (!username || sendingRequest) {
            return;
        }

        setSendingRequest(true);
        setRequestStatus(null);

        try {
            const response = await fetch(
                "/api/friends/request",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        username,
                    }),
                }
            );

            const data = (await response.json()) as {
                success?: boolean;
                message?: string;
                error?: string;
            };

            if (!response.ok) {
                setRequestStatus({
                    type: "error",
                    message:
                        data.error ??
                        "Failed to send friend request.",
                });

                return;
            }

            setRequestStatus({
                type: "success",
                message:
                    data.message ??
                    "Friend request sent.",
            });

            setPlayerName("");
        } catch (error) {
            console.error(
                "Failed to send friend request:",
                error
            );

            setRequestStatus({
                type: "error",
                message:
                    "Could not connect to the server.",
            });
        } finally {
            setSendingRequest(false);
        }
    }

    async function acceptFriendRequest(
        requestId: number
    ) {
        if (acceptingRequestId) {
            return;
        }

        setAcceptingRequestId(requestId);
        setRequestStatus(null);

        try {
            const response = await fetch(
                "/api/friends/accept",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        requestId,
                    }),
                }
            );

            const data = (await response.json()) as {
                success?: boolean;
                message?: string;
                error?: string;
            };

            if (!response.ok) {
                setRequestStatus({
                    type: "error",
                    message:
                        data.error ??
                        "Failed to accept friend request.",
                });

                return;
            }

            setFriendRequests(
                (currentRequests) =>
                    currentRequests.filter(
                        (request) =>
                            request.id !== requestId
                    )
            );

            setRequestStatus({
                type: "success",
                message:
                    data.message ??
                    "Friend request accepted.",
            });

            await loadFriends();
        } catch (error) {
            console.error(
                "Failed to accept friend request:",
                error
            );

            setRequestStatus({
                type: "error",
                message:
                    "Could not connect to the server.",
            });
        } finally {
            setAcceptingRequestId(null);
        }
    }

    function closeSocial() {
        setSocialOpen(false);
        setRequestStatus(null);
    }

    useEffect(() => {
        if (!socialOpen) {
            return;
        }

        setActiveSection("friends");
        setPlayerName("");

        void Promise.all([
            loadFriendRequests(),
            loadFriends(),
        ]);
    }, [socialOpen]);

    return (
        <div
            data-game-ui
            className={`${styles.socialWrapper} ${socialOpen ? styles.open : ""
                }`}
        >
            <div className={styles.header}>
                <p className={styles.title}>
                    Social
                </p>

                <button
                    type="button"
                    onClick={closeSocial}
                    className={styles.closeBtn}
                    aria-label="Close social menu"
                >
                    <XMarkIcon />
                </button>
            </div>

            <div
                className={styles.searchContainer}
            >
                <input
                    type="text"
                    placeholder="Player name"
                    value={playerName}
                    maxLength={32}
                    autoComplete="off"
                    onChange={(event) => {
                        setPlayerName(
                            event.target.value
                        );

                        if (requestStatus) {
                            setRequestStatus(null);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            void addFriend();
                        }
                    }}
                    onFocus={disableGameKeyboard}
                    onBlur={enableGameKeyboard}
                />

                <button
                    type="button"
                    className={
                        styles.addFriendBtn
                    }
                    disabled={
                        playerName.trim() === "" ||
                        sendingRequest
                    }
                    onClick={() =>
                        void addFriend()
                    }
                >
                    {sendingRequest
                        ? "Sending..."
                        : "+ Add Friend"}
                </button>
            </div>

            {requestStatus && (
                <p
                    className={
                        requestStatus.type ===
                            "success"
                            ? styles.successMessage
                            : styles.errorMessage
                    }
                    role={
                        requestStatus.type ===
                            "error"
                            ? "alert"
                            : "status"
                    }
                >
                    {requestStatus.message}
                </p>
            )}

            <div
                className={styles.friendsWrapper}
            >
                <h3>Friends</h3>
                <div className={styles.friendsHeaderButtons}>
                    <button
                        type="button"
                        className={`${styles.friendsSectionBtn} ${activeSection === "friends"
                                ? styles.activeSection
                                : ""
                            }`}
                        onClick={() => {
                            setActiveSection("friends");
                            void loadFriends();
                        }}
                    >
                        <img
                            src={FriendsIcon.src}
                            alt=""
                        />
                    </button>

                    <button
                        type="button"
                        className={`${styles.pendingSectionBtn} ${activeSection === "pending"
                                ? styles.activeSection
                                : ""
                            }`}
                        onClick={() => {
                            setActiveSection("pending");
                            void loadFriendRequests();
                        }}
                    >
                        <img
                            src={PendingIcon.src}
                            alt=""
                        />

                        {friendRequests.length > 0 && (
                            <span
                                className={
                                    styles.requestCount
                                }
                            >
                                {friendRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {activeSection === "friends" && (
                    <div className={styles.friendsContainer}>
                        {loadingFriends ? (
                            <p className={styles.emptyMessage}>
                                Loading friends...
                            </p>
                        ) : friendsError ? (
                            <p className={styles.errorMessage}>
                                {friendsError}
                            </p>
                        ) : friends.length === 0 ? (
                            <p className={styles.emptyMessage}>
                                You have not added any friends yet.
                            </p>
                        ) : (
                            friends.map((friend) => (
                                <div
                                    key={friend.friendshipId}
                                    className={styles.friend}
                                >
                                    <div
                                        className={
                                            styles.friendInfo
                                        }
                                    >
                                        <p
                                            className={
                                                styles.friendUsername
                                            }
                                        >
                                            {friend.username}
                                        </p>

                                        <p
                                            className={
                                                styles.friendStatus
                                            }
                                        >
                                            Friend
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {activeSection === "pending" && (
                    <div className={styles.pendingContainer}>
                        {loadingRequests ? (
                            <p className={styles.emptyMessage}>
                                Loading requests...
                            </p>
                        ) : requestsError ? (
                            <p className={styles.errorMessage}>
                                {requestsError}
                            </p>
                        ) : friendRequests.length === 0 ? (
                            <p className={styles.emptyMessage}>
                                No pending friend requests.
                            </p>
                        ) : (
                            friendRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className={
                                        styles.pendingRequest
                                    }
                                >
                                    <div
                                        className={
                                            styles.pendingRequestInfo
                                        }
                                    >
                                        <p
                                            className={
                                                styles.pendingPlayerName
                                            }
                                        >
                                            {request.username}
                                        </p>

                                        <p
                                            className={
                                                styles.pendingRequestText
                                            }
                                        >
                                            Friend request
                                        </p>
                                    </div>

                                    <div
                                        className={
                                            styles.pendingRequestActions
                                        }
                                    >
                                        <button
                                            type="button"
                                            className={
                                                styles.acceptRequestBtn
                                            }
                                            disabled={
                                                acceptingRequestId ===
                                                request.id
                                            }
                                            onClick={() =>
                                                void acceptFriendRequest(
                                                    request.id
                                                )
                                            }
                                        >
                                            {acceptingRequestId === request.id
                                                ? "Accepting..."
                                                : "Accept"}
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                styles.declineRequestBtn
                                            }
                                            disabled={
                                                acceptingRequestId ===
                                                request.id
                                            }
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
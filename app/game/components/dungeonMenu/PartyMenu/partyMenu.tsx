
import { useEffect, useState } from "react";
import styles from "./partyMenu.module.css";
import { gameState } from "../../../gameState/gameState";

type PartyMember = {
    sessionId: string;
    userId?: string;
    username: string;
    isLeader?: boolean;
    isReady?: boolean;
};

type PartyData = {
    roomCode: string | null;
    leaderSessionId?: string | null;
    members: PartyMember[];
};

export default function PartyMenu() {
    const [party, setParty] = useState<PartyData>({
        roomCode: null,
        leaderSessionId: null,
        members: [],
    });

    const [enteredRoomCode, setEnteredRoomCode] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    /*
     * Replace this with the player's actual username when available.
     */
    const username = "Player";

    useEffect(() => {
        let mounted = true;

        async function initializeParty() {
            const { multiplayer } = await import(
                "../../../network/multiplayer"
            );

            if (!mounted) return;

            setParty(
                multiplayer.getCurrentParty()
            );
        }

        const handlePartyUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<PartyData>;
            setParty(customEvent.detail);
        };

        void initializeParty();

        window.addEventListener(
            "party_updated",
            handlePartyUpdated
        );

        return () => {
            mounted = false;

            window.removeEventListener(
                "party_updated",
                handlePartyUpdated
            );
        };
    }, []);

    async function getPartyOptions() {
        const engine = gameState.engine;
        const resources = gameState.resources;
        const localPlayer = gameState.player;

        if (!engine) {
            throw new Error("The game engine is not ready.");
        }

        if (!resources) {
            throw new Error("The game resources are not ready.");
        }

        if (!localPlayer) {
            throw new Error("The local player is not ready.");
        }

        return {
            engine,
            resources,
            scene: engine.currentScene,
            username,
            localPlayer,
        };
    }

    async function createParty() {
        try {
            setIsCreating(true);
            setJoinError(null);

            const { multiplayer } = await import("../../../network/multiplayer");
            const options = await getPartyOptions();

            await multiplayer.createParty(options);

            setParty(previous => ({
                ...previous,
                roomCode: multiplayer.getCurrentPartyCode(),
            }));
        } catch (error) {
            console.error("Failed to create party:", error);

            setJoinError(
                error instanceof Error
                    ? error.message
                    : "Could not create a party."
            );
        } finally {
            setIsCreating(false);
        }
    }

    async function joinPartyByCode() {
        const normalizedCode = enteredRoomCode.trim().toUpperCase();

        if (!normalizedCode) {
            setJoinError("Enter a party code.");
            return;
        }

        if (normalizedCode === party.roomCode) {
            setJoinError("You are already in this party.");
            return;
        }

        try {
            setIsJoining(true);
            setJoinError(null);

            const { multiplayer } = await import("../../../network/multiplayer");
            const options = await getPartyOptions();

            await multiplayer.joinPartyByCode(normalizedCode, options);

            setParty(previous => ({
                ...previous,
                roomCode: multiplayer.getCurrentPartyCode(),
            }));

            setEnteredRoomCode("");
        } catch (error) {
            console.error("Failed to join party:", error);

            setJoinError(
                error instanceof Error
                    ? error.message
                    : "Could not join that party."
            );
        } finally {
            setIsJoining(false);
        }
    }

    async function leaveParty() {
        try {
            const { multiplayer } = await import(
                "../../../network/multiplayer"
            );

            const options = await getPartyOptions();

            await multiplayer.leaveParty(options);

            setParty({
                roomCode: null,
                leaderSessionId: null,
                members: [],
            });

            setEnteredRoomCode("");
            setJoinError(null);
        } catch (error) {
            console.error(
                "Failed to leave party:",
                error
            );

            setJoinError(
                error instanceof Error
                    ? error.message
                    : "Failed to leave the party."
            );
        }
    }

    function handleCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
        const normalizedValue = event.target.value
            .toUpperCase()
            .replace(/[^A-Z2-9]/g, "")
            .slice(0, 6);

        setEnteredRoomCode(normalizedValue);

        if (joinError) {
            setJoinError(null);
        }
    }

    function handleCodeKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "Enter") return;

        event.preventDefault();

        if (!isJoining && !isCreating) {
            void joinPartyByCode();
        }
    }

    const partySlots = Array.from({ length: 4 });
    const isInParty = party.roomCode !== null;

    return (
        <div className={styles.partyWrapper}>
            {!isInParty ? (
                <div className={styles.noPartyContainer}>
                    <div className={styles.header}>
                        <h3>Party</h3>
                        <p>Create or join a party.</p>
                    </div>

                    <button
                        type="button"
                        className={styles.createPartyButton}
                        disabled={isCreating || isJoining}
                        onClick={() => void createParty()}
                    >
                        {isCreating ? "Creating..." : "Create Party"}
                    </button>

                    <div className={styles.partyDivider}>
                        <span>OR</span>
                    </div>

                    <div className={styles.joinPartyContainer}>
                        <input
                            type="text"
                            value={enteredRoomCode}
                            maxLength={6}
                            placeholder="ENTER CODE"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={isJoining || isCreating}
                            onChange={handleCodeChange}
                            onKeyDown={handleCodeKeyDown}
                        />

                        <button
                            type="button"
                            disabled={
                                isJoining ||
                                isCreating ||
                                enteredRoomCode.length === 0
                            }
                            onClick={() => void joinPartyByCode()}
                        >
                            {isJoining ? "Joining..." : "Join Party"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                        <div className={styles.header}>
                            <div>
                                <h3>Party</h3>

                                <p>
                                    Code:{" "}
                                    <span className={styles.partyCode}>
                                        {party.roomCode}
                                    </span>
                                </p>
                            </div>

                            <button
                                className={styles.leaveButton}
                                onClick={() => void leaveParty()}
                            >
                                Leave
                            </button>
                        </div>

                    <div className={styles.playersContainer}>
                        {partySlots.map((_, index) => {
                            const member = party.members[index];

                            return (
                                <div
                                    key={member?.sessionId ?? index}
                                    className={`
                                        ${ styles.playerSlot }
                                        ${ member ? styles.occupiedPlayerSlot : styles.emptyPlayerSlot}
                                    `}
                                >
                                    {member ? (
                                        <div className={styles.playerInfo}>
                                            <p className={styles.playerName}>
                                                {member.username}
                                            </p>

                                            <div className={styles.playerStatuses}>
                                                {member.isLeader && (
                                                    <span className={styles.leaderStatus}>
                                                        Leader
                                                    </span>
                                                )}

                                                {member.isReady && (
                                                    <span className={styles.readyStatus}>
                                                        Ready
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={styles.emptySlotIcon}>
                                            +
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {joinError && (
                <p className={styles.joinError}>
                    {joinError}
                </p>
            )}
        </div>
    );
}

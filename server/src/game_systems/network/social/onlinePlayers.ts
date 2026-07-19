export type OnlinePlayer = {
    playerId: string;
    sessionId: string;
    name: string;
};

const onlinePlayersByName =
    new Map<string, OnlinePlayer>();

const onlinePlayersBySession =
    new Map<string, OnlinePlayer>();

function normalizePlayerName(name: string): string {
    return name.trim().toLowerCase();
}

export function addOnlinePlayer(
    player: OnlinePlayer
) {
    onlinePlayersByName.set(
        normalizePlayerName(player.name),
        player
    );

    onlinePlayersBySession.set(
        player.sessionId,
        player
    );
}

export function removeOnlinePlayerBySession(
    sessionId: string
) {
    const player =
        onlinePlayersBySession.get(sessionId);

    if (!player) return;

    onlinePlayersBySession.delete(sessionId);

    onlinePlayersByName.delete(
        normalizePlayerName(player.name)
    );
}

export function findOnlinePlayerByName(
    name: string
): OnlinePlayer | null {
    return (
        onlinePlayersByName.get(
            normalizePlayerName(name)
        ) ?? null
    );
}
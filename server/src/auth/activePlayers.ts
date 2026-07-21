// server/src/auth/activePlayers.ts

import type { Client } from "colyseus";

type ActivePlayerConnection = {
    client: Client;
    roomId: string;
};

const activePlayers = new Map<
    string,
    ActivePlayerConnection
>();

export function getActivePlayer(
    userId: string
): ActivePlayerConnection | undefined {
    return activePlayers.get(userId);
}

export function setActivePlayer(
    userId: string,
    connection: ActivePlayerConnection
): void {
    activePlayers.set(userId, connection);
}

export function removeActivePlayer(
    userId: string,
    sessionId: string
): void {
    const current = activePlayers.get(userId);

    // Do not remove a newer connection when an older
    // connection's onLeave runs afterward.
    if (current?.client.sessionId === sessionId) {
        activePlayers.delete(userId);
    }
}
const onlinePlayersByName = new Map();
const onlinePlayersBySession = new Map();
function normalizePlayerName(name) {
    return name.trim().toLowerCase();
}
export function addOnlinePlayer(player) {
    onlinePlayersByName.set(normalizePlayerName(player.name), player);
    onlinePlayersBySession.set(player.sessionId, player);
}
export function removeOnlinePlayerBySession(sessionId) {
    const player = onlinePlayersBySession.get(sessionId);
    if (!player)
        return;
    onlinePlayersBySession.delete(sessionId);
    onlinePlayersByName.delete(normalizePlayerName(player.name));
}
export function findOnlinePlayerByName(name) {
    return (onlinePlayersByName.get(normalizePlayerName(name)) ?? null);
}
//# sourceMappingURL=onlinePlayers.js.map
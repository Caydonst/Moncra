export interface MultiplayerContext {
    client: Client;

    room: Room | null;
    callbacks: ReturnType<
        typeof Callbacks.get
    > | null;

    currentRoomKind:
    | RoomKind
    | null;

    remotePlayers:
    Map<string, RemotePlayer>;

    localWeapon: any;

    setRoom(
        room: Room,
        kind: RoomKind
    ): void;

    clearRoom(
        expectedRoom?: Room
    ): void;

    clearRemotePlayers(): void;
}
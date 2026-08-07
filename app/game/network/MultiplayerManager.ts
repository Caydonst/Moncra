export type RoomKind =
    | "hub"
    | "party"
    | "dungeon";

export class MultiplayerManager {
    public readonly client: Client;

    public room: Room | null = null;
    public callbacks: ReturnType<typeof Callbacks.get> | null = null;
    public currentRoomKind: RoomKind | null = null;

    public localWeapon: any = null;

    public readonly remotePlayers =
        new Map<string, RemotePlayer>();

    public readonly enemyActors =
        new Map<string, Demon>();

    public readonly hub: HubRoomController;
    public readonly party: PartyRoomController;
    public readonly dungeon: DungeonRoomController;

    constructor(endpoint: string) {
        this.client = new Client(endpoint);

        this.hub = new HubRoomController(this);
        this.party = new PartyRoomController(this);
        this.dungeon = new DungeonRoomController(this);
    }

    public setRoom(
        room: Room,
        kind: RoomKind
    ): void {
        this.room = room;
        this.currentRoomKind = kind;
        this.callbacks = Callbacks.get(room);
    }

    public clearRoom(
        expectedRoom?: Room
    ): void {
        if (
            expectedRoom &&
            this.room !== expectedRoom
        ) {
            return;
        }

        this.room = null;
        this.callbacks = null;
        this.currentRoomKind = null;
    }

    public clearRemotePlayers(): void {
        for (
            const remotePlayer of
            this.remotePlayers.values()
        ) {
            remotePlayer.kill();
        }

        this.remotePlayers.clear();
    }
}
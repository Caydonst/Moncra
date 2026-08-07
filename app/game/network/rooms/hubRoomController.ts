import type {
    MultiplayerManager,
} from "../MultiplayerManager";

export class HubRoomController {
    constructor(
        private manager:
            MultiplayerManager
    ) { }

    public async join(options: {
        engine: ex.Engine;
        resources: GameResources;
        scene: HubScene;
        localPlayer: Player;
    }): Promise<void> {
        const accessToken =
            await this.getAccessToken();

        await this.leaveCurrentRoom();

        const room =
            await this.manager.client
                .create(
                    "hub_room",
                    {
                        accessToken,
                    }
                );

        this.manager.setRoom(
            room,
            "hub"
        );

        this.registerPlayers(
            room,
            options
        );

        this.registerLifecycle(room);
        this.registerInventory(room);
    }

    private registerPlayers(
        room: Room,
        options: {
            engine: ex.Engine;
            resources: GameResources;
            scene: HubScene;
            localPlayer: Player;
        }
    ): void {
        const callbacks =
            this.manager.callbacks;

        if (!callbacks) {
            return;
        }

        callbacks.onAdd(
            "players",
            (
                player: any,
                sessionId: string
            ) => {
                if (
                    sessionId ===
                    room.sessionId
                ) {
                    setupLocalPlayerCallbacks(
                        this.manager,
                        player
                    );

                    return;
                }

                addRemotePlayer(
                    this.manager,
                    player,
                    sessionId,
                    options
                );
            }
        );
    }

    private async getAccessToken(): Promise<string> {
        // Shared auth helper can replace this.
        throw new Error("Not implemented");
    }

    private async leaveCurrentRoom(): Promise<void> {
        const room =
            this.manager.room;

        if (!room) {
            return;
        }

        await room.leave(true);
        this.manager.clearRemotePlayers();
        this.manager.clearRoom(room);
    }

    private registerLifecycle(
        room: Room
    ): void {
        room.onLeave(code => {
            if (
                this.manager.room !== room
            ) {
                return;
            }

            this.manager.clearRemotePlayers();
            this.manager.clearRoom(room);
        });
    }

    private registerInventory(
        room: Room
    ): void {
        registerInventoryListeners(
            this.manager,
            room
        );
    }
}
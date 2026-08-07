export class PartyRoomController {
    private currentParty: PartyData = {
        roomCode: null,
        leaderSessionId: null,
        members: [],
    };

    constructor(
        private manager:
            MultiplayerManager
    ) { }

    public getCurrentParty(): PartyData {
        return {
            ...this.currentParty,
            members: [
                ...this.currentParty.members,
            ],
        };
    }

    public async create(
        options: PartyRoomOptions
    ): Promise<void> {
        const accessToken =
            await getAccessToken();

        await leaveCurrentGameplayRoom(
            this.manager
        );

        const room =
            await this.manager.client.create(
                "party_room",
                {
                    accessToken,
                    username:
                        options.username,
                    spawnX:
                        options.localPlayer.pos.x,
                    spawnY:
                        options.localPlayer.pos.y,
                }
            );

        this.configureRoom(
            room,
            options
        );
    }

    public async joinByCode(
        code: string,
        options: PartyRoomOptions
    ): Promise<void> {
        const roomCode =
            code.trim().toUpperCase();

        const accessToken =
            await getAccessToken();

        await leaveCurrentGameplayRoom(
            this.manager
        );

        const room =
            await this.manager.client
                .joinById(
                    roomCode,
                    {
                        accessToken,
                        username:
                            options.username,
                        spawnX:
                            options.localPlayer.pos.x,
                        spawnY:
                            options.localPlayer.pos.y,
                    }
                );

        this.configureRoom(
            room,
            options
        );
    }

    private configureRoom(
        room: Room,
        options: PartyRoomOptions
    ): void {
        this.manager.setRoom(
            room,
            "party"
        );

        registerPlayerListeners(
            this.manager,
            room,
            options
        );

        registerCombatListeners(
            this.manager,
            room
        );

        registerInventoryListeners(
            this.manager,
            room
        );

        this.registerPartyMessages(
            room
        );

        this.registerLifecycle(room);
        this.saveReconnectionToken(room);
    }

    private registerPartyMessages(
        room: Room
    ): void {
        room.onMessage(
            "party_updated",
            (data: PartyData) => {
                this.currentParty = {
                    roomCode:
                        data.roomCode,
                    leaderSessionId:
                        data.leaderSessionId ??
                        null,
                    members:
                        data.members ?? [],
                };

                window.dispatchEvent(
                    new CustomEvent(
                        "party_updated",
                        {
                            detail:
                                this.currentParty,
                        }
                    )
                );
            }
        );
    }

    private registerLifecycle(
        room: Room
    ): void {
        room.onLeave(() => {
            if (
                this.manager.room !== room
            ) {
                return;
            }

            this.manager.clearRemotePlayers();
            this.manager.clearRoom(room);

            this.currentParty = {
                roomCode: null,
                leaderSessionId: null,
                members: [],
            };
        });
    }

    private saveReconnectionToken(
        room: Room
    ): void {
        sessionStorage.setItem(
            "moncra-party-reconnection-token",
            room.reconnectionToken
        );
    }
}
type VisibleRoomOptions = {
    engine: ex.Engine;
    resources: GameResources;
    scene: ex.Scene;
    localPlayer: Player;
};

export function registerPlayerListeners(
    manager: MultiplayerManager,
    room: Room,
    options: VisibleRoomOptions
): void {
    const callbacks =
        manager.callbacks;

    if (!callbacks) {
        throw new Error(
            "Room callbacks are not initialized."
        );
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
                    manager,
                    player
                );

                options.localPlayer.pos =
                    ex.vec(
                        player.x,
                        player.y
                    );

                return;
            }

            if (
                manager.remotePlayers.has(
                    sessionId
                )
            ) {
                return;
            }

            const remotePlayer =
                new RemotePlayer(
                    ex.vec(
                        player.x,
                        player.y
                    ),
                    options.resources
                );

            manager.remotePlayers.set(
                sessionId,
                remotePlayer
            );

            options.scene.add(
                remotePlayer
            );

            remotePlayer.updateFromNetwork(
                player,
                options.engine
            );

            callbacks.onChange(
                player,
                () => {
                    remotePlayer
                        .updateFromNetwork(
                            player,
                            options.engine
                        );
                }
            );
        }
    );

    callbacks.onRemove(
        "players",
        (
            _player: any,
            sessionId: string
        ) => {
            const remotePlayer =
                manager.remotePlayers.get(
                    sessionId
                );

            if (!remotePlayer) {
                return;
            }

            remotePlayer.kill();

            manager.remotePlayers.delete(
                sessionId
            );
        }
    );
}
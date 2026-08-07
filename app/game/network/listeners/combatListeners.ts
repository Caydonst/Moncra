export function registerCombatListeners(
    manager: MultiplayerManager,
    room: Room
): void {
    room.onMessage(
        "weapon_attack",
        (data: RemoteAttackData) => {
            if (
                data.sessionId ===
                room.sessionId
            ) {
                manager.localWeapon
                    ?.confirmServerAttack?.(
                        data
                    );

                return;
            }

            manager.remotePlayers
                .get(data.sessionId)
                ?.playWeaponAttack(data);
        }
    );

    room.onMessage(
        "weapon_attack_start",
        data => {
            if (
                data.sessionId ===
                room.sessionId
            ) {
                return;
            }

            manager.remotePlayers
                .get(data.sessionId)
                ?.playWeaponAttackStart(
                    data
                );
        }
    );

    room.onMessage(
        "weapon_attack_release",
        data => {
            if (
                data.sessionId ===
                room.sessionId
            ) {
                return;
            }

            manager.remotePlayers
                .get(data.sessionId)
                ?.playWeaponAttackRelease(
                    data
                );
        }
    );
}
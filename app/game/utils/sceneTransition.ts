import { changeScene } from "./sceneChanges";
import { getGame } from "../gameInstance";
import type { Dungeon } from "../components/dungeonMenu/dungeonInfo";
import { gameState } from "../gameState/gameState";

let pendingDungeon: Dungeon | null = null;

export function getPendingDungeon() {
    return pendingDungeon;
}

export async function enterDungeon(dungeon: Dungeon) {
    if (typeof window === "undefined") return;

    pendingDungeon = dungeon;

    changeScene("dungeon");
}

export async function returnToHub() {
    if (typeof window === "undefined") return;
    if (!gameState.engine || !gameState.resources) return;

    const { multiplayer } = await import("../network/multiplayer");

    await multiplayer.joinHub({
        engine: gameState.engine,
        resources: gameState.resources,
    });

    changeScene("hub");
}
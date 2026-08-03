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

export function returnToHub() {
    if (typeof window === "undefined") {
        return;
    }

    changeScene("hub");
}
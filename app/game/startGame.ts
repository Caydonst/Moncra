
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";
import { createResources } from "./resources";
//import { loadMapData } from "./map";
import * as ex from "excalibur";
import {createCollisionGroups} from "@/app/game/utils/collisionGroups";
import {createGame, destroyGame} from "@/app/game/gameInstance";
import { HubScene } from "./scenes/HubScene";
import { gameState } from "./gameState/gameState";
import { DungeonScene } from "./scenes/DungeonScene";

export async function startGame(canvas: HTMLCanvasElement, onLoaded: () => void) {
    const resources = await createResources();
    const collisionGroups = await createCollisionGroups();

    const game = await createGame(canvas);

    game.add("game", new GameScene(resources, collisionGroups, game));
    game.add("menu", new MenuScene(game));
    game.add("hub", new HubScene(resources, collisionGroups, game, gameState));
    game.add("dungeon", new DungeonScene(resources, gameState));
    game.goToScene("menu");

    await game.start(resources.loader);



    onLoaded();

    return () => {
        destroyGame();
    };
}
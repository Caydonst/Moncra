
import { GameScene } from "./scenes/GameScene";
import { createResources } from "./resources";
//import { loadMapData } from "./map";
import * as ex from "excalibur";
import {createCollisionGroups} from "@/app/game/utils/collisionGroups";
import {createGame, destroyGame} from "@/app/game/gameInstance";

export async function startGame(canvas: HTMLCanvasElement, onLoaded: () => void) {
    const resources = await createResources();
    const collisionGroups = await createCollisionGroups();

    const game = await createGame(canvas);

    game.add("game", new GameScene(resources, collisionGroups, game));
    game.goToScene("game");

    await game.start(resources.loader);

    resources.tiledMap.addToScene(game.currentScene);

    onLoaded();

    return () => {
        destroyGame();
    };
}
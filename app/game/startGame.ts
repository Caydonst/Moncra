
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";
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
    game.add("menu", new MenuScene(game))
    game.goToScene("menu");

    await game.start(resources.loader);

    for (const layer of resources.tiledMap.layers) {
        if (layer.name === "floorBottom") {
            layer.tilemap.z = 5;
        }
        if (layer.name === "wallsTop") {
            layer.tilemap.z = 1;
        }
        if (layer.name === "wallsBottom") {
            layer.tilemap.z = 5;
        }
    }

    //resources.tiledMap.addToScene(game.currentScene);



    onLoaded();

    return () => {
        destroyGame();
    };
}
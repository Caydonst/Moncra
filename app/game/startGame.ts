

import * as ex from "excalibur";
import {createGame, destroyGame} from "@/app/game/gameInstance";
import { gameState } from "./gameState/gameState";

export async function startGame(canvas: HTMLCanvasElement, onLoaded: () => void) {
    const ex = await import("excalibur");

    const { GameScene } = await import("./scenes/GameScene");
    const { MenuScene } = await import("./scenes/MenuScene");
    const { HubScene } = await import("./scenes/HubScene");
    const { DungeonScene } = await import("./scenes/DungeonScene");
    const { createResources } = await import("./resources");
    const { createCollisionGroups } = await import("@/app/game/utils/collisionGroups");
    const { createGameItems } = await import("./items/GameItems");

    const resources = await createResources();
    const collisionGroups = await createCollisionGroups();

    const game = await createGame(canvas);
    gameState.engine = game;
    createGameItems()

    /*
    game.add("game", new GameScene(resources, collisionGroups, game));
    game.add("menu", new MenuScene(game));
    game.add("hub", new HubScene(resources, collisionGroups, game, gameState));
    game.add("dungeon", new DungeonScene(resources, gameState, collisionGroups));
    game.goToScene("menu");
   */ 

    const sceneTransitions = {
        in: new ex.FadeInOut({duration: 500, direction: 'in', color: ex.Color.Black}),
        out: new ex.FadeInOut({duration: 500, direction: 'out', color: ex.Color.Black})
    }

    game.add("game", new GameScene(resources, collisionGroups, game));
    game.add("menu", new MenuScene(game));
    game.add("hub", {
        scene: new HubScene(resources, collisionGroups, game, gameState),
        transitions: sceneTransitions,
    });
    game.add("dungeon", {
        scene: new DungeonScene(resources, gameState, collisionGroups),
        transitions: sceneTransitions,
    });
    

    await game.start(resources.loader);

    onLoaded();

    return () => {
        destroyGame();
    };
}
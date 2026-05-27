import * as ex from "excalibur"
import { getGame } from "../gameInstance";

export function changeScene(sceneString: string) {
    const game = getGame();

    switch (sceneString) {
        case "hub":
            game.goToScene("hub");
            break;
        case "dungeon":
            game.goToScene("dungeon");
            break;
    }

    window.dispatchEvent(
        new CustomEvent("scene-changed", {
            detail: {
                sceneName: sceneString,
            },
        })
    );
}
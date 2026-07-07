let game: any = null;

export async function createGame(canvas: HTMLCanvasElement) {
    if (game) return game;

    const ex = await import("excalibur");

    game = new ex.Engine({
        canvasElement: canvas,
        width: 1920,
        height: 1080,
        backgroundColor: ex.Color.fromHex("#483B3A"),
        displayMode: ex.DisplayMode.FillContainer,
        pixelArt: true,
        pointerScope: ex.PointerScope.Document,
        physics: {
            colliders: {
                compositeStrategy: "separate",
            },
        },
        //maxFps: 40
    });

    return game;
}

export function getGame() {
    if (!game) throw new Error("Game not initialized");
    return game;
}

export function destroyGame() {
    if (game) {
        game.stop();
        game = null;
    }
}
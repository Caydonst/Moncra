import * as ex from "excalibur";

export async function createWeaponFactory(item: any, gameState: any) {
    
    const scene = gameState.engine.currentScene;

    const swordImages: Record<string, ex.ImageSource> = {
        great_sword0: scene.resources.Images.greatSword0,
        great_sword1: scene.resources.Images.greatSword,
        great_sword2: scene.resources.Images.greatSword1,
        obsidian_sword: scene.resources.Images.greatSword1,
    };

    const image = swordImages[item.id] ?? scene.resources.Images.greatSword0;

    console.log(item)
    /*
    if (item.kind === "Great Sword" && item.specialization.name === "Sentinel") {
        const { Sentinel } = await import("@/app/game/weapons/sentinel");
        return new Sentinel(
            scene.player,
            gameState.engine,
            scene.resources,
            scene.collisionGroups,
            item.stats.damage,
            image,
            true,
            item,
        );
    }
    */
    
    if (item.kind === "Great Sword") {
        const { GreatSword } = await import("@/app/game/weapons/sword");
        return new GreatSword(
            scene.player,
            gameState.engine,
            scene.resources,
            scene.collisionGroups,
            item.stats.damage,
            image,
            false,
            item,
        );
    }
        

    throw new Error(`No weapon factory for kind: ${item.kind}`);
}
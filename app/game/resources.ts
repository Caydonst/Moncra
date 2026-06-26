// resources.ts
import * as ex from "excalibur";
import { TiledResource } from "@excaliburjs/plugin-tiled";

// --- MAP ---
const tiledMap = new TiledResource("/maps/hub.tmx");
// --- CHARACTER ---
import characterWalkSheetImage from "./assets/character/walk/walk_spritesheet3.png"
import characterIdleSheetImage from "./assets/character/idle/idle_spritesheet2.png"
import characterWalk0 from "./assets/character/walk/walk0.png";
import characterWalk1 from "./assets/character/walk/walk1.png";
import characterWalk2 from "./assets/character/walk/walk2.png";
import characterWalk3 from "./assets/character/walk/walk3.png";
import characterIdle0 from "./assets/character/idle/idle0.png";
import characterIdle1 from "./assets/character/idle/idle1.png";
import characterIdle2 from "./assets/character/idle/idle2.png";
import characterIdle3 from "./assets/character/idle/idle3.png";
// --- DEMON ---
import demonWalk0 from "./assets/enemies/demon/walk/walk0.png";
import demonWalk1 from "./assets/enemies/demon/walk/walk1.png";
import demonWalk2 from "./assets/enemies/demon/walk/walk2.png";
import demonWalk3 from "./assets/enemies/demon/walk/walk3.png";
import demonDead0 from "./assets/enemies/demon/death/dead0.png";
import demonDead1 from "./assets/enemies/demon/death/dead1.png";
import demonDead2 from "./assets/enemies/demon/death/dead2.png";
import demonDead3 from "./assets/enemies/demon/death/dead3.png";
import demonHurt from "./assets/enemies/demon/hurt/hurt0.png";
// --- BOSS ---
import demonBossIdleSheetImage from "./assets/enemies/boss/DemonBoss/idle/idle_spritesheet.png"
import demonBossWalkSheetImage from "./assets/enemies/boss/DemonBoss/walk/walk_spritesheet.png"
import demonBossHurt from "./assets/enemies/boss/DemonBoss/hurt/hurt0.png"
// --- AFTER-DEATH ANIMATION ---
import miscDead0 from "./assets/enemies/misc/dead0.png";
import miscDead1 from "./assets/enemies/misc/dead1.png";
import miscDead2 from "./assets/enemies/misc/dead2.png";
import miscDead3 from "./assets/enemies/misc/dead3.png";
import miscDead4 from "./assets/enemies/misc/dead4.png";
import miscDead5 from "./assets/enemies/misc/dead5.png";
import miscDead6 from "./assets/enemies/misc/dead6.png";
import miscDead7 from "./assets/enemies/misc/dead7.png";
import miscDead8 from "./assets/enemies/misc/dead8.png";
import miscDead9 from "./assets/enemies/misc/dead9.png";
import miscDead10 from "./assets/enemies/misc/dead10.png";
import miscDead11 from "./assets/enemies/misc/dead11.png";
// --- SPRITESHEET ---
import Tilesheet from "./assets/map/spritesheet.png";
// --- WEAPONS ---
import arrowImage from './assets/projectiles/arrow.png';

import greatSword0 from "./assets/weapons/great_sword/stone_sword.png";
import greatSword from "./assets/weapons/great_sword/forged.png";
import greatSword1 from "./assets/weapons/great_sword/ruby_sword.png";
import greatSword2 from "./assets/weapons/great_sword/diamond_sword.png";
import greatSword3 from "./assets/weapons/great_sword/iron_sword.png";
import greatSword4 from "./assets/weapons/great_sword/gold_sword.png";
import greatSword5 from "./assets/weapons/great_sword/emerald_sword.png";
import greatSword6 from "./assets/weapons/great_sword/cataclysm2.png";
import greatSword7 from "./assets/weapons/great_sword/oblivion2.png";
import greatSword8 from "./assets/weapons/great_sword/ascension.png";
import greatSword9 from "./assets/weapons/great_sword/verdict.png";
import greatSword10 from "./assets/weapons/great_sword/tidal.png";
import greatSword11 from "./assets/weapons/great_sword/starfall.png";

import bow from "./assets/weapons/bow/bow.png";
import spearImg from "./assets/weapons/spear_and_shield/spear1.png"
import shieldImg from "./assets/weapons/spear_and_shield/shield1.png"
import bowSpritesheetImg from "./assets/weapons/bow/bow_spritesheet.png"
// --- ARMOR ---
import obsidianArmorImg from "./assets/armor/obsidian_armor.png"
// --- MISC ---
import coinSpritesheet from "./assets/currency/coin_spritesheet.png";
import goldImg from "./assets/currency/gold_icon.png"
import chestImage from "./assets/chest/chest.png"
import chestSelected from "./assets/chest/chest_selected.png"
import chestOpen from "./assets/chest/chest_open.png"
import chestSpritesheet from "./assets/chest/chest_spritesheet.png"
import storageChestImage from "./assets/chest/storage_chest.png"
import storageChestSelectedImage from "./assets/chest/storage_chest_selected.png"
import storageChestOpenImage from "./assets/chest/storage_chest_opened.png"
import portalSpritesheetImage from "./assets/misc/portal_spritesheet.png"
import portalSelectedSpritesheetImage from "./assets/misc/portal_selected_spritesheet.png"
import {CustomLoader} from "@/app/game/utils/customLoader";
import mapSpritesheet64 from "./assets/map/map_spritesheet_64.png"
import test_material from "./assets/currency/test_material.png"

// --- NPC ---
import blacksmithSpritesheetImage from "./assets/npc/blacksmith/idle_spritesheet.png"
import blacksmithSelectedSpritesheetImage from "./assets/npc/blacksmith/selected_spritesheet.png"

type ImageGroups = {
    walk: Record<string, any>;
    idle: Record<string, any>;
    dead: Record<string, any>;
    hurt: Record<string, any>;
};

type Sound = {
    reload: ex.Sound | null;
    shoot: ex.Sound | null;
}

type SoundGroup = {
    pistol: Sound | null;
    rifle: Sound | null;
    shotgun: Sound | null;
    gunEmpty: ex.Sound;
}

export type GameResources = Awaited<ReturnType<typeof createResources>>;

export async function createResources() {
    const ex = await import("excalibur");

    const Images = {
        characterWalkSheetImage: new ex.ImageSource(characterWalkSheetImage.src),
        characterIdleSheetImage: new ex.ImageSource(characterIdleSheetImage.src),
        portalSpritesheet: new ex.ImageSource(portalSpritesheetImage.src),
        portalSelectedSpritesheet: new ex.ImageSource(portalSelectedSpritesheetImage.src),
        mapSpritesheetImage: new ex.ImageSource(mapSpritesheet64.src),
        arrow: new ex.ImageSource(arrowImage.src),
        tileSheet: new ex.ImageSource(Tilesheet.src),
        greatSword0: new ex.ImageSource(greatSword0.src),
        greatSword: new ex.ImageSource(greatSword.src),
        greatSword1: new ex.ImageSource(greatSword1.src),
        greatSword2: new ex.ImageSource(greatSword2.src),
        greatSword3: new ex.ImageSource(greatSword3.src),
        greatSword4: new ex.ImageSource(greatSword4.src),
        greatSword5: new ex.ImageSource(greatSword5.src),
        greatSword6: new ex.ImageSource(greatSword6.src),
        greatSword7: new ex.ImageSource(greatSword7.src),
        greatSword8: new ex.ImageSource(greatSword8.src),
        greatSword9: new ex.ImageSource(greatSword9.src),
        greatSword10: new ex.ImageSource(greatSword10.src),
        greatSword11: new ex.ImageSource(greatSword11.src),
        bow: new ex.ImageSource(bow.src),
        bowSpritesheetImg: new ex.ImageSource(bowSpritesheetImg.src),
        spear: new ex.ImageSource(spearImg.src),
        shield: new ex.ImageSource(shieldImg.src),
        obsidianArmor: new ex.ImageSource(obsidianArmorImg.src),
        coinSheetImage: new ex.ImageSource(coinSpritesheet.src),
        goldImage: new ex.ImageSource(goldImg.src),
        chestSheetImage: new ex.ImageSource(chestSpritesheet.src),
        chest: new ex.ImageSource(chestImage.src),
        chestSelected: new ex.ImageSource(chestSelected.src),
        chestOpen: new ex.ImageSource(chestOpen.src),
        storageChest: new ex.ImageSource(storageChestImage.src),
        storageChestSelected: new ex.ImageSource(storageChestSelectedImage.src),
        storageChestOpen: new ex.ImageSource(storageChestOpenImage.src),
        blacksmithSheetImage: new ex.ImageSource(blacksmithSpritesheetImage.src),
        blacksmithSelectedSheetImage: new ex.ImageSource(blacksmithSelectedSpritesheetImage.src),
        demonBossIdleSheetImage: new ex.ImageSource(demonBossIdleSheetImage.src),
        demonBossHurt: new ex.ImageSource(demonBossHurt.src),
        demonBossWalkSheetImage: new ex.ImageSource(demonBossWalkSheetImage.src),
        testMaterial: new ex.ImageSource(test_material.src),
    };

    const PlayerImages: ImageGroups = {
        walk: {
            characterWalk0: new ex.ImageSource(characterWalk0.src),
            characterWalk1: new ex.ImageSource(characterWalk1.src),
            characterWalk2: new ex.ImageSource(characterWalk2.src),
            characterWalk3: new ex.ImageSource(characterWalk3.src),
        },
        idle: {
            characterIdle0: new ex.ImageSource(characterIdle0.src),
            characterIdle1: new ex.ImageSource(characterIdle1.src),
            characterIdle2: new ex.ImageSource(characterIdle2.src),
            characterIdle3: new ex.ImageSource(characterIdle3.src),
        },
        dead: {},
        hurt: {},
    };

    const DemonImages: ImageGroups = {
        walk: {
            demonWalk0: new ex.ImageSource(demonWalk0.src),
            demonWalk1: new ex.ImageSource(demonWalk1.src),
            demonWalk2: new ex.ImageSource(demonWalk2.src),
            demonWalk3: new ex.ImageSource(demonWalk3.src),
        },
        idle: {},
        dead: {
            demonDead0: new ex.ImageSource(demonDead0.src),
            demonDead1: new ex.ImageSource(demonDead1.src),
            demonDead2: new ex.ImageSource(demonDead2.src),
            demonDead3: new ex.ImageSource(demonDead3.src),
        },
        hurt: {
            demonHurt: new ex.ImageSource(demonHurt.src),
        },
    };

    const MiscImages: { [key: string]: ex.ImageSource } = {
        miscDead0: new ex.ImageSource(miscDead0.src),
        miscDead1: new ex.ImageSource(miscDead1.src),
        miscDead2: new ex.ImageSource(miscDead2.src),
        miscDead3: new ex.ImageSource(miscDead3.src),
        miscDead4: new ex.ImageSource(miscDead4.src),
        miscDead5: new ex.ImageSource(miscDead5.src),
        miscDead6: new ex.ImageSource(miscDead6.src),
        miscDead7: new ex.ImageSource(miscDead7.src),
        miscDead8: new ex.ImageSource(miscDead8.src),
        miscDead9: new ex.ImageSource(miscDead9.src),
        miscDead10: new ex.ImageSource(miscDead10.src),
        miscDead11: new ex.ImageSource(miscDead11.src),

    };

    const tileSheet = ex.SpriteSheet.fromImageSource({
        image: Images.tileSheet,
        grid: {
            rows: 32,
            columns: 32,
            spriteWidth: 16,
            spriteHeight: 16,
        },
    });

    const characterWalkSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.characterWalkSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 15,
            spriteHeight: 21,
        }
    });

    const characterIdleSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.characterIdleSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 15,
            spriteHeight: 21,
        }
    });
    const demonBossIdleSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.demonBossIdleSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 26,
            spriteHeight: 31,
        }
    });
    const demonBossWalkSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.demonBossWalkSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 23,
            spriteHeight: 34,
        }
    });

    const bowSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.bowSpritesheetImg,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 16,
            spriteHeight: 16,
        }
    });

    const CoinSpriteSheet = ex.SpriteSheet.fromImageSource({
        image: Images.coinSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 6,
            spriteHeight: 7,
        }
    });

    const chestSpriteSheet = ex.SpriteSheet.fromImageSource({
        image: Images.chestSheetImage,
        grid: {
            rows: 1,
            columns: 2,
            spriteWidth: 16,
            spriteHeight: 16,
        }
    })

    const portalSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.portalSpritesheet,
        grid: {
            rows: 1,
            columns: 8,
            spriteWidth: 64,
            spriteHeight: 64,
        }
    })
    
    const portalSelectedSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.portalSelectedSpritesheet,
        grid: {
            rows: 1,
            columns: 8,
            spriteWidth: 64,
            spriteHeight: 64,
        }
    })

    const blacksmithSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.blacksmithSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 22,
            spriteHeight: 26,
        }
    })

    const blacksmithSelectedSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.blacksmithSelectedSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 24,
            spriteHeight: 28,
        }
    })

    const mapSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.mapSpritesheetImage,
        grid: {
            rows: 1,
            columns: 15,
            spriteWidth: 64,
            spriteHeight: 64,
        },
    });

    const sounds: SoundGroup = {
        rifle: {
            reload: new ex.Sound("/sounds/reload/rifle_reload.mp3"),
            shoot: new ex.Sound("/sounds/gunshots/rifle_shot.mp3"),
        },
        pistol: {
            reload: new ex.Sound("/sounds/reload/pistol_reload.mp3"),
            shoot: new ex.Sound("/sounds/gunshots/pistol_shot.mp3"),
        },
        shotgun: null,
        gunEmpty: new ex.Sound("/sounds/misc/gun_empty.wav"),
    }


    function collect(obj: any): any[] {
        let arr: any[] = [];
        for (const key in obj) {
            if (obj[key] instanceof ex.ImageSource) {
                arr.push(obj[key]);
            } else if (typeof obj[key] === "object") {
                arr = arr.concat(collect(obj[key]));
            }
        }
        return arr;
    }

    function collectSounds(group: SoundGroup): ex.Sound[] {
        const result: ex.Sound[] = [];

        for (const weapon of Object.values(group)) {
            if (!weapon) continue;

            for (const sound of Object.values(weapon)) {
                if (sound instanceof ex.Sound) {
                    result.push(sound);
                }
            }
        }

        result.push(sounds.gunEmpty);

        console.log(result);

        return result;
    }

    const allResources = [
        ...Object.values(Images),
        ...collect(PlayerImages),
        ...collect(DemonImages),
        ...Object.values(MiscImages),
        ...collectSounds(sounds),
        tiledMap,
    ];

    // --- LOADER ---
    const loader = new CustomLoader(allResources);

    allResources.forEach(r => loader.addResource(r));

    return {
        ex,
        Images,
        characterWalkSpritesheet,
        characterIdleSpritesheet,
        demonBossIdleSpritesheet,
        demonBossWalkSpritesheet,
        demonBossHurt,
        PlayerImages,
        DemonImages,
        MiscImages,
        loader,
        tileSheet,
        chestSpriteSheet,
        bowSpritesheet,
        CoinSpriteSheet,
        portalSpritesheet,
        portalSelectedSpritesheet,
        blacksmithSpritesheet,
        blacksmithSelectedSpritesheet,
        mapSpritesheet,
        tiledMap,
    };
}
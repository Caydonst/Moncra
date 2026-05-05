// resources.ts
import * as ex from "excalibur";

// --- CHARACTER ---
import characterWalkSheetImage from "./assets/character/walk/walk_spritesheet1.png"
import characterIdleSheetImage from "./assets/character/walk/idle_spritesheet.png"
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
import reconImg from "./assets/weapons/bow/blaster5.png";
import m9Img from "./assets/weapons/bow/pistol.png"
import arrowImage from './assets/projectiles/arrow.png';
import bulletImage from './assets/projectiles/arrow2.png';
import warHammer from "./assets/weapons/war_hammer/anime_war_hammer.png";
import greatSword from "./assets/weapons/great_sword/anime_sword.png";
/// --- MISC ---
import coinSpritesheet from "./assets/currency/coin_spritesheet.png";
import chestImage from "./assets/chest/chest.png"
import chestSelected from "./assets/chest/chest_selected.png"
import chestOpen from "./assets/chest/chest_open.png"
import chestSpritesheet from "./assets/chest/chest_spritesheet.png"
import handgunMagImg from "./assets/weapons/bow/handgun_mag.png"
import rifleMagImg from "./assets/weapons/bow/rifle_mag.png"
import {CustomLoader} from "@/app/ game/utils/customLoader";

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
        arrow: new ex.ImageSource(arrowImage.src),
        tileSheet: new ex.ImageSource(Tilesheet.src),
        recon: new ex.ImageSource(reconImg.src),
        m9: new ex.ImageSource(m9Img.src),
        warHammer: new ex.ImageSource(warHammer.src),
        greatSword: new ex.ImageSource(greatSword.src),
        coinSheetImage: new ex.ImageSource(coinSpritesheet.src),
        chestSheetImage: new ex.ImageSource(chestSpritesheet.src),
        chest: new ex.ImageSource(chestImage.src),
        chestSelected: new ex.ImageSource(chestSelected.src),
        chestOpen: new ex.ImageSource(chestOpen.src),
        demonBossIdleSheetImage: new ex.ImageSource(demonBossIdleSheetImage.src),
        demonBossHurt: new ex.ImageSource(demonBossHurt.src),
        demonBossWalkSheetImage: new ex.ImageSource(demonBossWalkSheetImage.src),
        bullet: new ex.ImageSource(bulletImage.src),
        rifleMag: new ex.ImageSource(rifleMagImg.src),
        handgunMag: new ex.ImageSource(handgunMagImg.src),
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
            columns: 5,
            spriteWidth: 15,
            spriteHeight: 27,
        }
    });

    const characterIdleSpritesheet = ex.SpriteSheet.fromImageSource({
        image: Images.characterIdleSheetImage,
        grid: {
            rows: 1,
            columns: 4,
            spriteWidth: 15,
            spriteHeight: 19,
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
        CoinSpriteSheet,
        sounds,
    };
}
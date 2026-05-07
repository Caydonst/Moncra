// scenes/GameScene.ts
import * as ex from "excalibur";

import {
    //loadMapData,
    //loadTileMaps, createTileMaps,
    createSimpleMap,
    floorTilePositions,
    worldWidth,
    worldHeight
} from '../map';
import { Player } from '../player';
import { Demon } from '../enemies/demon';
import { Gun } from '../weapons/gun';
import { WarHammer } from '../weapons/warhammer';
import { Chest } from "../chest"
import AUGImg from "../assets/weapons/bow/blaster4.png";
import FALImg from "../assets/weapons/bow/blaster6.png";
import AR15Img from "../assets/weapons/bow/blaster7.png";
import AugImg from "../assets/weapons/bow/blaster4.png";
import GlockImg from "../assets/weapons/bow/pistol1.png"
import DeagleImg from "../assets/weapons/bow/pistol2.png"
import handgunMagImg from "../assets/weapons/bow/handgun_mag.png"
import rifleMagImg from "../assets/weapons/bow/rifle_mag1.png"
import HandgunImg from "../assets/weapons/bow/pistol.png";
import HandgunMagImg from "../assets/weapons/bow/handgun_mag.png";
import RifleMagImg from "../assets/weapons/bow/rifle_mag1.png";
import SmgMagImg from "../assets/weapons/bow/smg_mag.png";
import ShotgunShellsImg from "../assets/weapons/bow/shotgun_shells.png";
import warHammer from "../assets/weapons/war_hammer/anime_war_hammer.png";
import { Inventory } from "../inventory/inventory";
import type {Ammunition, Item, Weapon} from "../items/ItemTypes";
import {GreatSword} from "../weapons/sword";
//import { spawnWallsInto } from "../map";
import {DemonBoss} from "../enemies/bosses/DemonBoss";
import type { GameResources } from "../resources";
import {Rifle} from "@/app/ game/weapons/rifle";
import {Pistol} from "@/app/ game/weapons/pistol";
import { ParticleSystem } from "../utils/ParticleSystem";

type Maps = {
    layer1: number[][];
    layer2: number[][];
    layer3: number[][];
};

export class GameScene extends ex.Scene {
    player!: Player;
    gun!: Gun;
    warHammer!: WarHammer;
    greatSword!: GreatSword;
    enemyCount!: number;
    enemyTag!: HTMLElement;
    enemies!: []
    inventory!: Inventory;
    chest1!: Chest;
    chest2!: Chest;
    chest3!: Chest;
    public particles!: ParticleSystem;

    constructor(
        private resources: GameResources,
        private collisionGroups: any,
        public engine: ex.Engine
    )
    {
        super();
    }

    async onInitialize(engine: ex.Engine) {
        try {
// --- Create Player ---

            // --- Add Weapon ---
            //this.add(this.warHammer);

            // --- Collision Groups ---


            // --- Add tilemap ---
            /*
            const TILE_SIZE = 70;
            const { layer1, layer2, layer3 } = this.maps;
            const { tilemap1, tilemap2, tilemap3 } = createTileMaps(this.resources.ex, layer1);

            const COLS = layer1[0].length;
            const ROWS = layer1.length;

            const worldWidth = COLS * TILE_SIZE;
            const worldHeight = ROWS * TILE_SIZE;

            loadTileMaps(this.resources.ex, tilemap1, tilemap3, layer1, layer3, this.resources.tileSheet);

            this.add(tilemap1);
            this.add(tilemap2);
            this.add(tilemap3);

            spawnWallsInto(this.resources.ex, this, layer2, this.resources.tileSheet, this.collisionGroups);

             */

            const fpsText = new ex.Text({
                text: "FPS: 0",
                font: new ex.Font({
                    size: 20,
                    family: "Arial",
                    color: ex.Color.White,
                }),
            });

            const fpsHud = new ex.ScreenElement({
                pos: ex.vec(20, 90),
                anchor: ex.vec(0, 0),
                z: 9999,
            });

            fpsHud.graphics.use(fpsText);

            engine.currentScene.add(fpsHud);

            fpsHud.on("postupdate", () => {
                fpsText.text = `FPS: ${Math.round(engine.stats.currFrame.fps)}`;
            });

            createSimpleMap(ex, this, this.collisionGroups);

            this.particles = new ParticleSystem(500);
            this.add(this.particles);

            this.player = new Player(400, 300, 1920, 1080, this.resources, this.collisionGroups);
            this.add(this.player);


            const warHammerOffset = ex.vec(26, 0);
            this.warHammer = new WarHammer(this.player, engine, warHammerOffset, this.resources);

            this.greatSword = new GreatSword(this.player, engine, this.resources, this.collisionGroups);

            console.log(engine.graphicsContext);

            // --- Inventory ---
            this.inventory = new Inventory()

            const rifleMag: Ammunition = {
                id: "rifle_mag1",
                name: "Rifle Magazine",
                type: "rifle",
                icon: rifleMagImg.src,
                rarity: "common",
                amount: 30,
                maxAmount: 30,
            }
            const AR15: Weapon = {
                id: "rifle_1",
                name: "AR15",
                type: "rifle",
                icon: AR15Img.src,
                rarity: "legendary",
                stats: {
                    damage: 50,
                },
                magazine: rifleMag,
                createWeapon: () => new Rifle(
                    this.player,
                    engine,
                    ex.vec(25, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.ar15,
                    AR15,
                    this.inventory,
                ),
            };
            const AUG: Weapon = {
                id: "rifle_1",
                name: "AUG",
                type: "rifle",
                icon: AUGImg.src,
                rarity: "legendary",
                stats: {
                    damage: 50,
                },
                magazine: rifleMag,
                createWeapon: () => new Rifle(
                    this.player,
                    engine,
                    ex.vec(25, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.aug,
                    AUG,
                    this.inventory,
                ),
            };
            const FAL: Weapon = {
                id: "rifle_1",
                name: "FAL",
                type: "rifle",
                icon: FALImg.src,
                rarity: "epic",
                stats: {
                    damage: 50,
                },
                magazine: rifleMag,
                createWeapon: () => new Rifle(
                    this.player,
                    engine,
                    ex.vec(25, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.fal,
                    FAL,
                    this.inventory,
                ),
            };
            const handgunMag: Ammunition = {
                id: "handgun_mag1",
                name: "Handgun Magazine",
                type: "pistol",
                icon: HandgunMagImg.src,
                rarity: "common",
                amount: 20,
                maxAmount: 20,
            }
            const Glock: Weapon = {
                id: "handgun_1",
                name: "Glock",
                type: "pistol",
                icon: GlockImg.src,
                rarity: "epic",
                stats: {
                    damage: 20,
                },
                magazine: handgunMag,
                createWeapon: () => new Pistol(
                    this.player,
                    engine, ex.vec(18, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.glock,
                    Glock,
                    this.inventory,
                ),
            };
            const Deagle: Weapon = {
                id: "handgun_1",
                name: "Desert Eagle",
                type: "pistol",
                icon: DeagleImg.src,
                rarity: "legendary",
                stats: {
                    damage: 20,
                },
                magazine: handgunMag,
                createWeapon: () => new Pistol(
                    this.player,
                    engine, ex.vec(18, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.deagle,
                    Deagle,
                    this.inventory,
                ),
            };

            const smgMag: Ammunition = {
                id: "smg_mag1",
                name: "SMG Magazine",
                type: "smg",
                icon: SmgMagImg.src,
                rarity: "common",
                amount: 0,
                maxAmount: 50,
            }
            const shotgunShells: Ammunition = {
                id: "shotgun_shells1",
                name: "Shotgun Shells",
                type: "shotgun",
                icon: ShotgunShellsImg.src,
                rarity: "common",
                amount: 10,
                maxAmount: 10,
            }

            this.inventory.addItem(AR15)
            this.inventory.addItem(AUG)
            this.inventory.addItem(FAL)
            this.inventory.addItem(Glock)
            this.inventory.addItem(Deagle)
            this.inventory.addItem(handgunMag)
            this.inventory.addItem(rifleMag)
            this.inventory.addItem(smgMag)
            this.inventory.addItem(shotgunShells)

            function getRandomItems() {
                const itemsList = [AR15, AUG, FAL, Glock, Deagle, handgunMag, rifleMag, smgMag, shotgunShells]
                const chestItems: (Item | Weapon | Ammunition | null)[] = Array(12).fill(null);

                const randomFour = itemsList.sort(() => 0.5 - Math.random()).slice(0, 4);
                const indexes = new Set()
                randomFour.forEach((item) => {
                    let indexFound = false;
                    while (!indexFound) {
                        const randomIndex = Math.floor(Math.random() * 12);
                        if (!indexes.has(randomIndex)) {
                            indexFound = true;
                            chestItems[randomIndex] = {...item, id: `${randomIndex}`};
                            indexes.add(randomIndex);
                        }
                    }
                })

                return chestItems;
            }



            this.chest1 = new Chest(ex.vec(500, 500), this.resources, getRandomItems());
            this.add(this.chest1);

            this.chest2 = new Chest(ex.vec(800, 1200), this.resources, getRandomItems());
            this.add(this.chest2);

            this.chest3 = new Chest(ex.vec(1400, 200), this.resources, getRandomItems());
            this.add(this.chest3);

            // --- Camera setup ---
            //engine.currentScene.camera.strategy.lockToActor(this.player);

            const bounds = new ex.BoundingBox(
                -200,
                -200,
                worldWidth + 200,
                worldHeight + 200
            );
            engine.currentScene.camera.strategy.limitCameraBounds(bounds);

        } catch (err) {
            console.error("GameScene init failed:", err);
            throw err;
        }


    }


    onPostUpdate(engine: ex.Engine, delta: number) {
        //console.log('FPS:', this.engine.stats.currFrame.fps);
        const camera = engine.currentScene.camera;

        const lookAhead = this.player.vel.scale(0.15);
        const target = this.player.pos.add(lookAhead);

        const followStrength = 3;
        const t = 1 - Math.exp(-followStrength * (delta / 1000));

        camera.pos = camera.pos.lerp(target, t);
    }
    public getInventory() {
        return this.inventory;
    }
    public spawnEnemy() {
        const randomPos = Math.floor(Math.random() * floorTilePositions.length);

        const enemy = new Demon(
            this.engine,
            ex.vec(floorTilePositions[randomPos].x, floorTilePositions[randomPos].y),
            worldWidth,
            worldHeight,
            this.player,
            300,
            100,
            100,
            this.resources,
            this.collisionGroups,
        );

        this.add(enemy);
    }
    public spawnBoss() {
        const randomPos = Math.floor(Math.random() * floorTilePositions.length);

        const boss = new DemonBoss(
            this.engine,
            ex.vec(floorTilePositions[randomPos].x, floorTilePositions[randomPos].y),
            worldWidth,
            worldHeight,
            this.player,
            200,
            300,
            300,
            this.resources,
            this.collisionGroups,
        );

        this.add(boss);
    }
}


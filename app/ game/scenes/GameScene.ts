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
import M4Img from "../assets/weapons/bow/m4.png";
import AK47Img from "../assets/weapons/bow/ak47.png";
import ScoutImg from "../assets/weapons/bow/scout.png";
import MinigunImg from "../assets/weapons/bow/minigun.png";
import MP5Img from "../assets/weapons/bow/mp5.png"
import M9Img from "../assets/weapons/bow/m9.png"
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
import { SMG } from "../weapons/smg";
import { ParticleManager } from "../utils/ParticleHelper";
import {getSpawnPointsFromTiledMap} from "./helperFunctions"
import { DarknessOverlay } from "../utils/darknessOverlay";

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
    public enemySpawnPoints: ex.Vector[] = [];

    particleManager!: ParticleManager;

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

            //createSimpleMap(ex, this, this.collisionGroups);

            this.particleManager = new ParticleManager(this);

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
                amount: 999,
                maxAmount: 999,
            }
            const M4: Weapon = {
                id: "rifle_1",
                name: "M4",
                type: "rifle",
                icon: M4Img.src,
                rarity: "legendary",
                stats: {
                    damage: 30,
                },
                magazine: rifleMag,
                createWeapon: () => new Rifle(
                    this.player,
                    engine,
                    ex.vec(15, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.m4,
                    M4,
                    this.inventory,
                ),
            };
            const Minigun: Weapon = {
                id: "minigun",
                name: "Minigun",
                type: "rifle",
                icon: MinigunImg.src,
                rarity: "legendary",
                stats: {
                    damage: 50,
                },
                magazine: rifleMag,
                createWeapon: () => new Rifle(
                    this.player,
                    engine,
                    ex.vec(25, 10),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.minigun,
                    Minigun,
                    this.inventory,
                ),
            };
            const handgunMag: Ammunition = {
                id: "handgun_mag1",
                name: "Handgun Magazine",
                type: "pistol",
                icon: HandgunMagImg.src,
                rarity: "common",
                amount: 999,
                maxAmount: 999,
            }
            const MP5: Weapon = {
                id: "handgun_1",
                name: "MP5",
                type: "rifle",
                icon: MP5Img.src,
                rarity: "epic",
                stats: {
                    damage: 20,
                },
                magazine: rifleMag,
                createWeapon: () => new SMG(
                    this.player,
                    engine, ex.vec(13, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.mp5,
                    MP5,
                    this.inventory,
                ),
            };
            const M9: Weapon = {
                id: "handgun_1",
                name: "M9",
                type: "pistol",
                icon: M9Img.src,
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
                    this.resources.Images.m9,
                    M9,
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

            this.inventory.addItem(M4)
            this.inventory.addItem(MP5)
            this.inventory.addItem(M9)
            this.inventory.addItem(Minigun)
            this.inventory.addItem(handgunMag)
            this.inventory.addItem(rifleMag) 
            this.inventory.addItem(smgMag)
            this.inventory.addItem(shotgunShells)

            function getRandomItems() {
                const itemsList = [M4, MP5, M9, handgunMag, rifleMag, smgMag, shotgunShells]
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
            this.camera.zoom = 1.25

        } catch (err) {
            console.error("GameScene init failed:", err);
            throw err;
        }

        console.log(this.resources.tiledMap)

        this.enemySpawnPoints = getSpawnPointsFromTiledMap(
            ex,
            this.resources.tiledMap,
            "floor"
        );

        console.log(this.enemySpawnPoints)


    }


    onPostUpdate(engine: ex.Engine, delta: number) {
        const camera = engine.currentScene.camera;
        const pointer = engine.input.pointers.primary;

        const mouseWorldPos = engine.screenToWorldCoordinates(pointer.lastScreenPos);

        // Direction from player to mouse
        const mouseOffset = mouseWorldPos.sub(this.player.pos);

        const maxLookDistance = 2000;

        const clampedOffset =
            mouseOffset.size > maxLookDistance
                ? mouseOffset.normalize().scale(maxLookDistance)
                : mouseOffset;

        const lookAmount = 0.1;

        const targetPos = this.player.pos.add(
            clampedOffset.scale(lookAmount)
        );

        // ---- MAP BOUNDS ----
        const mapWidth = worldWidth;
        const mapHeight = worldHeight;

        const halfScreenW = engine.drawWidth / 2;
        const halfScreenH = engine.drawHeight / 2;

        const clampedX = Math.max(
            halfScreenW,
            Math.min(mapWidth - halfScreenW, targetPos.x)
        );

        const clampedY = Math.max(
            halfScreenH,
            Math.min(mapHeight - halfScreenH, targetPos.y)
        );

        camera.pos = ex.vec(clampedX, clampedY);
    }
    public getInventory() {
        return this.inventory;
    }

    private getRandomSpawn() {
        const index = Math.floor(Math.random() * this.enemySpawnPoints.length);
        return this.enemySpawnPoints[index].clone();
    }
    
    public spawnEnemy() {
        const randomIndex = Math.floor(Math.random() * this.enemySpawnPoints.length);
        const spawnPos = this.enemySpawnPoints[randomIndex];
        console.log(spawnPos)

        const enemy = new Demon(
            this.engine,
            spawnPos,
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
        const randomIndex = Math.floor(Math.random() * this.enemySpawnPoints.length);
        const spawnPos = this.enemySpawnPoints[randomIndex];

        const boss = new DemonBoss(
            this.engine,
            spawnPos,
            worldWidth,
            worldHeight,
            this.player,
            200,
            5000,
            5000,
            this.resources,
            this.collisionGroups,
        );

        this.add(boss);
    }
}


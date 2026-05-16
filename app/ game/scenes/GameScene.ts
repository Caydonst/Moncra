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
import { Bow } from '../weapons/bow';
import { WarHammer } from '../weapons/warhammer';
import { Chest } from "../chest"
import warHammer from "../assets/weapons/war_hammer/anime_war_hammer.png";
import greatSword from "../assets/weapons/great_sword/anime_sword.png";
import bow from "../assets/weapons/bow/bow.png";
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
import { EnemyPlayer } from "../enemies/enemyPlayer"
import { ProjectileManager } from "../utils/projectileManager";

type Maps = {
    layer1: number[][];
    layer2: number[][];
    layer3: number[][];
};

export class GameScene extends ex.Scene {
    player!: Player;
    enemyPlayer!: EnemyPlayer;
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
    public projectileManager!: ProjectileManager;

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
            
            this.camera.zoom = 1.25
            
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

            this.projectileManager = new ProjectileManager(
                this.resources,
                this.collisionGroups
            );

            this.add(this.projectileManager);

            this.particleManager = new ParticleManager(this);

            this.player = new Player(400, 300, 1920, 1080, this.resources, this.collisionGroups);
            this.add(this.player);


            const warHammerOffset = ex.vec(26, 0);
            this.warHammer = new WarHammer(this.player, engine, warHammerOffset, this.resources);

            //this.greatSword = new GreatSword(this.player, engine, this.resources, this.collisionGroups);

            console.log(engine.graphicsContext);

            // --- Inventory ---
            this.inventory = new Inventory()
            

            const GreatSword1: Weapon = {
                id: "great_sword1",
                name: "Great Sword",
                type: "greatsword",
                icon: greatSword.src,
                rarity: "legendary",
                stats: {
                    damage: 30,
                },
                magazine: null,
                createWeapon: () => new GreatSword(
                    this.player,
                    engine,
                    this.resources,
                    this.collisionGroups,
                ),
            };

            this.inventory.addItem(GreatSword1);

            const Bow1: Weapon = {
                id: "bow1",
                name: "Bow",
                type: "bow",
                icon: bow.src,
                rarity: "legendary",
                stats: {
                    damage: 30,
                },
                magazine: null,
                createWeapon: () => new Bow(
                    this.player,
                    engine,
                    ex.vec(10, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.bow,
                ),
            };

            this.inventory.addItem(Bow1);

            function getRandomItems() {
                const itemsList = [null]
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


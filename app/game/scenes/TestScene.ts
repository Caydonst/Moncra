// scenes/GameScene.ts
import * as ex from "excalibur";

import {
    //loadMapData,
    //loadTileMaps, createTileMaps,
    createSimpleMap,
    floorTilePositions,
} from '../map';
import { Player } from '../player/player';
import { Demon } from '../enemies/demon';
import { Bow } from '../weapons/bow';
import { WarHammer } from '../weapons/warhammer';
import { Chest } from "../chest"
import warHammer from "../assets/weapons/war_hammer/anime_war_hammer.png";
import greatSword from "../assets/weapons/great_sword/anime_sword.png";
import SNSImg from "../assets/weapons/sword_and_shield/crystal_sns.png";
import bow from "../assets/weapons/bow/bow.png";
import { Inventory } from "../inventory/inventory";
import type {Ammunition, Item, Weapon} from "../items/ItemTypes";
import {GreatSword} from "../weapons/sword";
//import { spawnWallsInto } from "../map";
import {DemonBoss} from "../enemies/bosses/DemonBoss";
import type { GameResources } from "../resources";
import { DustParticleManager, ParticleManager } from "../utils/ParticleHelper";
import {getSpawnPointsFromTiledMap} from "./helperFunctions"
import { EnemyPlayer } from "../enemies/enemyPlayer"
import { ProjectileManager } from "../utils/projectileManager";
import { Portal } from "../portal";
import { generateDungeon, createTileMapFromDungeon, tileToWorld } from "../utils/mapGenerator"

type Maps = {
    layer1: number[][];
    layer2: number[][];
    layer3: number[][];
};

export class TestScene extends ex.Scene {
    player!: Player;
    enemyPlayer!: EnemyPlayer;
    warHammer!: WarHammer;
    greatSword!: GreatSword;
    enemyCount!: number;
    enemyTag!: HTMLElement;
    enemies!: []
    inventory!: Inventory;
    chest1!: Chest;
    chest2!: Chest;
    chest3!: Chest;
    portal!: Portal;
    public enemySpawnPoints: ex.Vector[] = [];
    public projectileManager!: ProjectileManager;

    particleManager!: ParticleManager;
    dustParticleManager!: DustParticleManager;

    public worldBounds!: {
        width: number;
        height: number;
    };

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
            
            this.camera.zoom = 1.10

            this.particleManager = new ParticleManager(this);

            const baseLayer = this.resources.tiledMap.layers[0].tilemap;

            const generatedMap = generateDungeon(100, 100);
            const tileMap = createTileMapFromDungeon(generatedMap.map, this.resources.mapSpritesheet)
            this.add(tileMap);

            console.log(generatedMap);
            this.worldBounds = {
                width: generatedMap.map.length * 64,
                height: generatedMap.map[0].length * 64,
            };

            console.log(this.worldBounds)
            
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

            this.player = new Player(tileToWorld(generatedMap.playerSpawn.x, generatedMap.playerSpawn.y), 1920, 1080, this.resources, this.collisionGroups);
            this.add(this.player);

            this.dustParticleManager = new DustParticleManager();
            this.add(this.dustParticleManager);


            const warHammerOffset = ex.vec(26, 0);
            this.warHammer = new WarHammer(this.player, engine, warHammerOffset, this.resources);

            //this.greatSword = new GreatSword(this.player, engine, this.resources, this.collisionGroups);

            this.portal = new Portal(ex.vec(this.worldBounds.width / 2, this.worldBounds.height / 2), this.resources)
            this.add(this.portal);

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

            const SNS: Weapon = {
                id: "great_sword1",
                name: "Sword & Shield",
                type: "greatsword",
                icon: SNSImg.src,
                rarity: "rare",
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

            this.inventory.addItem(SNS);

            const Bow1: Weapon = {
                id: "bow1",
                name: "Bow",
                type: "bow",
                icon: bow.src,
                rarity: "epic",
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
                const itemsList = [GreatSword1, Bow1]
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

        this.enemySpawnPoints = getSpawnPointsFromTiledMap(
            ex,
            this.resources.tiledMap,
            "floor"
        );


    }


    onPostUpdate(engine: ex.Engine, delta: number) {
        const camera = engine.currentScene.camera;

        // Center directly on player
        const targetPos = this.player.pos;

        // Map/world size
        const mapWidth = this.worldBounds.width;
        const mapHeight = this.worldBounds.height;

        // Account for zoom
        const halfScreenW = (engine.drawWidth / camera.zoom) / 2;
        const halfScreenH = (engine.drawHeight / camera.zoom) / 2;

        // Clamp camera inside map bounds
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
        
        const enemy = new Demon(
            this.engine,
            spawnPos,
            this.worldBounds.width,
            this.worldBounds.height,
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
            this.worldBounds.width,
            this.worldBounds.height,
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


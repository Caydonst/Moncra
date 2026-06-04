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
import greatSword from "../assets/weapons/great_sword/cataclysm.png";
import greatSword1 from "../assets/weapons/great_sword/obsidian_sword.png";
import SNSImg from "../assets/weapons/sword_and_shield/crystal_sns.png";
import bow from "../assets/weapons/bow/bow.png";
import { Inventory } from "../inventory/inventory";
import type { Ammunition, Item, Weapon } from "../items/ItemTypes";
import { GreatSword } from "../weapons/sword";
import { Armor } from "../armor/armor"
import {SpearAndShield} from "../weapons/spearAndShield"
import spearAndShieldImg from "../assets/weapons/spear_and_shield/spear_and_shield1.png"
//import { spawnWallsInto } from "../map";
import { DemonBoss } from "../enemies/bosses/DemonBoss";
import type { GameResources } from "../resources";
import { DustParticleManager, ParticleManager } from "../utils/ParticleHelper";
import { getSpawnPointsFromTiledMap } from "./helperFunctions"
import { EnemyPlayer } from "../enemies/enemyPlayer"
import { ProjectileManager } from "../utils/projectileManager";
import { Portal } from "../portal";
import { generateDungeonFloor, createTileMapFromDungeonFloor, tileToWorld } from "../utils/mapGenerator"
import { GameState } from "../gameState/gameState";
import { multiplayer } from "../network/multiplayer";
import { StorageChest } from "../HubSystems/StorageChest";
import { Blacksmith } from "../HubSystems/blacksmith";
import obsidianArmorImg from "../assets/armor/obsidian_armor.png"
import { CriticalHit, ChainLightning } from "@/app/game/enchantments/enchantments";

type Maps = {
    layer1: number[][];
    layer2: number[][];
    layer3: number[][];
};

export class HubScene extends ex.Scene {
    player!: Player;
    enemyPlayer!: EnemyPlayer;
    warHammer!: WarHammer;
    greatSword!: GreatSword;
    enemyCount!: number;
    enemyTag!: HTMLElement;
    enemies!: []
    storageChest!: StorageChest;
    blacksmith: Blacksmith;
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
        public engine: ex.Engine,
        private gameState: GameState,
    )
    {
        super();
    }

    async onInitialize(engine: ex.Engine) {
        try {
            
            this.camera.zoom = 1.20

            this.particleManager = new ParticleManager(this);


            this.resources.tiledMap.addToScene(this);

            for (const layer of this.resources.tiledMap.layers) {
                if (layer.name === "floorBottom") {
                    layer.tilemap.z = 5;
                }
                if (layer.name === "wallsTop") {
                    layer.tilemap.z = 1;
                }
                if (layer.name === "wallsBottom") {
                    layer.tilemap.z = 5;
                }
            }

            const baseLayer = this.resources.tiledMap.layers[0].tilemap;

            const generatedMap = generateDungeonFloor(100, 100);
            //const tileMap = createTileMapFromDungeon(generatedMap.map, this.resources.mapSpritesheet)
            //this.add(tileMap);
            //this.add(baseLayer);

            console.log(generatedMap);
            this.worldBounds = {
                width: baseLayer.width,
                height: baseLayer.height,
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

            this.player = new Player(ex.vec(400, 400), 1920, 1080, this.resources, this.collisionGroups, this.gameState);
            this.gameState.player = this.player;
            this.add(this.player);

            this.dustParticleManager = new DustParticleManager();
            this.add(this.dustParticleManager);


            const warHammerOffset = ex.vec(26, 0);
            this.warHammer = new WarHammer(this.player, engine, warHammerOffset, this.resources);

            //this.greatSword = new GreatSword(this.player, engine, this.resources, this.collisionGroups);

            this.portal = new Portal(ex.vec(this.worldBounds.width / 2, this.worldBounds.height / 2), this.resources, "hub")
            this.add(this.portal);
            

            const GreatSword1: Weapon = {
                id: "great_sword1",
                name: "Cataclysm",
                type: "Great Sword",
                icon: greatSword.src,
                rarity: "exalted",
                attackStyle: "Melee",
                stats: {
                    power: 130,
                    damage: 40,
                },
                enchantments: [CriticalHit, ChainLightning],
                createWeapon: () => new GreatSword(
                    this.player,
                    engine,
                    this.resources,
                    this.collisionGroups,
                    GreatSword1.stats.damage,
                    this.resources.Images.greatSword,
                    true,
                    GreatSword1,
                ),
            };

            this.gameState.inventory.addItem(GreatSword1);

            const GreatSword2: Weapon = {
                id: "great_sword2",
                name: "Sword",
                type: "Great Sword",
                icon: greatSword1.src,
                rarity: "tempered",
                attackStyle: "Melee",
                stats: {
                    power: 30,
                    damage: 20,
                },
                createWeapon: () => new GreatSword(
                    this.player,
                    engine,
                    this.resources,
                    this.collisionGroups,
                    GreatSword2.stats.damage,
                    this.resources.Images.greatSword1,
                    false,
                ),
            };

            this.gameState.inventory.addItem(GreatSword2);

            const ObsidianSword: Weapon = {
                id: "obsidian_sword",
                name: "Obsidian Sword",
                type: "Great Sword",
                icon: greatSword1.src,
                rarity: "exalted",
                attackStyle: "Melee",
                stats: {
                    power: 130,
                    damage: 40,
                },
                createWeapon: () => new GreatSword(
                    this.player,
                    engine,
                    this.resources,
                    this.collisionGroups,
                    GreatSword2.stats.damage,
                    this.resources.Images.greatSword1,
                    false,
                ),
            };

            this.gameState.inventory.addItem(ObsidianSword);

            const Bow1: Weapon = {
                id: "bow1",
                name: "Runed Bow",
                type: "Bow",
                icon: bow.src,
                rarity: "relic",
                attackStyle: "Ranged",
                stats: {
                    power: 90,
                    damage: 30,
                },
                createWeapon: () => new Bow(
                    this.player,
                    engine,
                    ex.vec(7, 0),
                    this.resources,
                    this.collisionGroups,
                    this.resources.Images.bow,
                    Bow1.stats.damage
                ),
            };

            this.gameState.inventory.addItem(Bow1);

            const ObsidianArmor = new Armor({
                id: "obsidian_armor",
                name: "Obsidian Armor",
                description: "A sturdy iron chestplate.",
                icon: obsidianArmorImg.src,
                type: "Armor",
                rarity: "exalted",
                stats: {
                    hp: 50,
                    defense: 15,
                    power: 130,
                }
            })

            this.gameState.inventory.addItem(ObsidianArmor);

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

            this.storageChest = new StorageChest(ex.vec(this.worldBounds.width / 2, 200), this.resources, getRandomItems());
            this.add(this.storageChest);

            this.blacksmith = new Blacksmith(ex.vec(200, this.worldBounds.height / 2), this.resources, getRandomItems());
            this.add(this.blacksmith);

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

    async onActivate() {
        await multiplayer.connect(this.engine, this.resources);
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
        return this.gameState.inventory;
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
            this.player,
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
            1000,
            1000,
            this.resources,
            this.collisionGroups,
        );

        this.add(boss);
    }
}


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
import { Chest } from "../chest/chest";
import warHammer from "../assets/weapons/war_hammer/anime_war_hammer.png";
import greatSword from "../assets/weapons/great_sword/vampire_sword.png";
import greatSword1 from "../assets/weapons/great_sword/ruby_sword.png";
import greatSword2 from "../assets/weapons/great_sword/diamond_sword.png";
import greatSword3 from "../assets/weapons/great_sword/iron_sword.png";
import greatSword4 from "../assets/weapons/great_sword/gold_sword.png";
import greatSword5 from "../assets/weapons/great_sword/emerald_sword.png";
import greatSword6 from "../assets/weapons/great_sword/cataclysm2.png";
import greatSword7 from "../assets/weapons/great_sword/oblivion2.png";
import greatSword8 from "../assets/weapons/great_sword/ascension.png";
import greatSword9 from "../assets/weapons/great_sword/verdict.png";
import greatSword10 from "../assets/weapons/great_sword/tidal.png";
import greatSword11 from "../assets/weapons/great_sword/starfall.png";
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
import { createTileMapFromDungeonFloor } from "../utils/mapGenerator"
import { GameState } from "../gameState/gameState";
import { multiplayer } from "../network/multiplayer";
import { StorageChest } from "../HubSystems/StorageChest";
import { Blacksmith } from "../HubSystems/blacksmith";
import obsidianArmorImg from "../assets/armor/obsidian_armor.png"
import { CriticalHit, ChainLightning } from "@/app/game/enchantments/enchantments";
import { gameItems } from "../items/GameItems";

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
                switch (layer.name) {
                    case "floorBottom":
                        layer.tilemap.z = 0;
                        break;

                    case "wallsBottom":
                        layer.tilemap.z = 1;
                        break;

                    case "wallsTop":
                        layer.tilemap.z = 20;
                        break;
                }
            }

            const baseLayer = this.resources.tiledMap.layers[0].tilemap;

            //const generatedMap = generateDungeonFloor(100, 100);
            //const tileMap = createTileMapFromDungeon(generatedMap.map, this.resources.mapSpritesheet)
            //this.add(tileMap);
            //this.add(baseLayer);

            //console.log(generatedMap);
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

            if (!this.gameState.player) {
                this.player = new Player(
                    ex.vec(400, 400),
                    1920,
                    1080,
                    this.resources,
                    this.collisionGroups,
                    this.gameState
                );

                this.gameState.player = this.player;
                this.player.attachToScene(this);
            } else {
                this.player = this.gameState.player;
            }

            this.dustParticleManager = new DustParticleManager();
            this.add(this.dustParticleManager);


            const warHammerOffset = ex.vec(26, 0);
            this.warHammer = new WarHammer(this.player, engine, warHammerOffset, this.resources);

            //this.greatSword = new GreatSword(this.player, engine, this.resources, this.collisionGroups);

            this.portal = new Portal(ex.vec(this.worldBounds.width / 2, this.worldBounds.height / 2), this.resources, "hub")
            this.add(this.portal);
            

            

            function getRandomItems() {
                const itemsList = []
                const chestItems: (Item | Weapon | Ammunition | null)[] = Array(12).fill(null);

                for (let i = 0; i < 5; i++) {
                    itemsList.push(gameItems.materials.legendaryTestMaterial)
                }

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

                return itemsList;
            }

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

    async onActivate(): Promise<void> {
        console.log("HUB onActivate fired");

        const player = this.gameState.player;

        if (!player) {
            throw new Error(
                "Cannot enter HubScene without a player."
            );
        }

        this.player = player;

        this.storageChest
            ?.setInteractionEnabled(true);

        this.portal
            ?.setInteractionEnabled(true);

        try {
            await multiplayer.joinHub({
                engine: this.engine,
                resources: this.resources,
                localPlayer: this.player,
                scene: this,
            });
        } catch (error) {
            console.error("joinHub failed:", error);
        }

        this.restorePlayerToHub();

        const weapon =
            this.gameState.inventory.weapon?.instance;

        console.log("Hub weapon during activate:", weapon);

        if (!weapon) {
            console.warn(
                "No weapon instance found during HubScene.onActivate"
            );
            return;
        }

        await this.gameState.inventory
            .attachEquippedWeaponToScene(
                this.engine,
                this
            );
    }

    onDeactivate(): void {
        this.storageChest
            ?.setInteractionEnabled(false);

        this.portal
            ?.setInteractionEnabled(false);

        this.player?.detachFromScene(this);

        this.gameState.inventory
            .detachEquippedWeaponFromScene(
                this
            );
    }

    private restorePlayerToHub(): void {
        const player = this.gameState.player;

        if (!player) {
            console.error(
                "No player exists in GameState."
            );
            return;
        }

        this.player = player;

        player.pos = ex.vec(400, 400);
        player.vel = ex.vec(0, 0);

        player.attachToScene(this);

        this.camera.pos = player.pos.clone();

        console.log("Player restored to hub:", {
            playerScene: player.scene,
            hubScene: this,
            attachedToHub: player.scene === this,
            killed: player.isKilled(),
            pos: player.pos.toString(),
        });
    }

    private clampCameraAxis(
        target: number,
        worldSize: number,
        halfViewportSize: number
    ): number {
        // The map is smaller than the visible area.
        // Keep the camera centered on the map.
        if (worldSize <= halfViewportSize * 2) {
            return worldSize / 2;
        }

        return ex.clamp(
            target,
            halfViewportSize,
            worldSize - halfViewportSize
        );
    }

    onPostUpdate(_engine: ex.Engine, delta: number): void {
        if (!this.worldBounds || !this.player) {
            return;
        }

        const camera = this.camera;
        const targetPos = this.player.pos;

        const halfScreenW =
            this.engine.drawWidth / camera.zoom / 2;

        const halfScreenH =
            this.engine.drawHeight / camera.zoom / 2;

        const clampedX = this.clampCameraAxis(
            targetPos.x,
            this.worldBounds.width,
            halfScreenW
        );

        const clampedY = this.clampCameraAxis(
            targetPos.y,
            this.worldBounds.height,
            halfScreenH
        );

        const target = ex.vec(
            clampedX,
            clampedY
        );

        const followSpeed = 5;
        const t =
            1 -
            Math.exp(
                -followSpeed * (delta / 1000)
            );

        camera.pos = camera.pos.lerp(
            target,
            t
        );
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


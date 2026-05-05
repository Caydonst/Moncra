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
import greatSword from "../assets/weapons/great_sword/iron_sword.png";
import AssaultRifleImg from "../assets/weapons/bow/blaster5.png";
import HandgunImg from "../assets/weapons/bow/pistol.png";
import HandgunMagImg from "../assets/weapons/bow/handgun_mag.png";
import RifleMagImg from "../assets/weapons/bow/rifle_mag.png";
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
    chest!: Chest;

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

            createSimpleMap(ex, this, this.collisionGroups);

            this.player = new Player(400, 300, 1920, 1080, this.resources, this.collisionGroups);
            this.add(this.player);

            // --- Create Weapons ---
            const bowOffset = ex.vec(0, 0);


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
                icon: RifleMagImg.src,
                rarity: "common",
                amount: 30,
                maxAmount: 30,
            }
            const rifleMag2: Ammunition = {
                id: "rifle_mag2",
                name: "Rifle Magazine",
                type: "rifle",
                icon: RifleMagImg.src,
                rarity: "common",
                amount: 30,
                maxAmount: 30,
            }
            const AssaultRifle: Weapon = {
                id: "rifle_1",
                name: "Recon",
                type: "rifle",
                icon: AssaultRifleImg.src,
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
                    this.resources.Images.recon,
                    AssaultRifle,
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
            const handgunMag1: Ammunition = {
                id: "handgun_mag2",
                name: "Handgun Magazine",
                type: "pistol",
                icon: HandgunMagImg.src,
                rarity: "common",
                amount: 20,
                maxAmount: 20,
            }
            const Handgun: Weapon = {
                id: "handgun_1",
                name: "M9",
                type: "pistol",
                icon: HandgunImg.src,
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
                    Handgun,
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

            this.inventory.addItem(AssaultRifle)
            this.inventory.addItem(Handgun)
            this.inventory.addItem(handgunMag)
            this.inventory.addItem(handgunMag1)
            this.inventory.addItem(rifleMag)
            this.inventory.addItem(rifleMag2)
            this.inventory.addItem(smgMag)
            this.inventory.addItem(shotgunShells)

            // --- chest ---
            const handgunMag2: Ammunition = {
                id: "handgun_mag4",
                name: "Handgun Magazine",
                type: "pistol",
                icon: HandgunMagImg.src,
                rarity: "common",
                amount: 20,
                maxAmount: 20,
            }
            const handgunMag3: Ammunition = {
                id: "handgun_mag3",
                name: "Handgun Magazine",
                type: "pistol",
                icon: HandgunMagImg.src,
                rarity: "common",
                amount: 20,
                maxAmount: 20,
            }
            const rifleMag3: Ammunition = {
                id: "rifle_mag3",
                name: "Rifle Magazine",
                type: "rifle",
                icon: RifleMagImg.src,
                rarity: "common",
                amount: 30,
                maxAmount: 30,
            }
            const chestItems: (Item | Weapon | Ammunition | null)[] = Array(24).fill(null);

            chestItems[5] = rifleMag3;
            chestItems[11] = handgunMag3;
            chestItems[15] = handgunMag2;

            this.chest = new Chest(ex.vec(500, 500), this.resources, chestItems);
            this.add(this.chest);

            // --- Camera setup ---
            engine.currentScene.camera.strategy.lockToActor(this.player);

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


    onPostUpdate() {
        //console.log('FPS:', this.engine.stats.currFrame.fps);
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
            250,
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


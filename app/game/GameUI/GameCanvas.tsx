"use client";
import {useEffect, useRef, useState} from "react";
import { getGame } from "../gameInstance";
import type { GameScene } from "../scenes/GameScene";
import type { HubScene } from "../scenes/HubScene";
import type { MenuScene } from "../scenes/MenuScene";
import type { TestScene } from "../scenes/TestScene";
import type { DungeonScene } from "../scenes/DungeonScene";
import {Inventory} from "@/app/game/inventory/inventory";
import styles from "../page.module.css"
import InventoryUI from "@/app/game/components/inventoryUI/inventoryUI";
import ChestUI from "@/app/game/components/chestUI/chestUI";
import DungeonMenu from "../components/dungeonMenu/dungeonMenu";
import LandingPage from "../components/landingPage/landingPage";
import { gameState } from "../gameState/gameState";

type Scenes = GameScene | HubScene | MenuScene | TestScene | DungeonScene
type SceneKey = "menu" | "hub" | "game" | "dungeon" | "test";

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [game, setGame] = useState(null);
    const [scene, setScene] = useState<Scenes | null>(null);
    const [sceneName, setSceneName] = useState<SceneKey | null>(null);
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [inventoryOpen, setInventoryOpen] = useState<boolean>(false);
    const [itemPanelOpen, setItemPanelOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [gameLoaded, setGameLoaded] = useState(false);
    const [characterHp, setCharacterHp] = useState(0);
    const [chestItems, setChestItems] = useState(null);
    const [chestOpen, setChestOpen] = useState(false);
    const [chest, setChest] = useState(null);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        async function init() {
            if (!canvasRef.current) return;

            const canvas = canvasRef.current;

            // ensure it's real DOM node
            if (!(canvas instanceof HTMLCanvasElement)) {
                console.error("Not a canvas:", canvas);
                return;
            }

            const { setupInventoryUI } = await import("../inventory/updateInventoryUI");
            setupInventoryUI();

            const { startGame } = await import("../startGame");
            cleanup = await startGame(canvasRef.current!, () => {
                setGameLoaded(true);
            });

            const game = getGame()
            setGame(game);

            syncScene(game.currentScene as Scenes, "menu");
        }

        init();

        return () => cleanup?.();
    }, []);

    const isMenuScene = sceneName === "menu";
    const isHubScene = sceneName === "hub";
    const isDungeonScene = sceneName === "dungeon";
    const isGameScene = isHubScene || isDungeonScene || sceneName === "game";

    function syncScene(newScene: Scenes, newSceneName: SceneKey) {
        setScene(newScene);
        setSceneName(newSceneName);

        setInventory(gameState.inventory);

        if (gameState.player) {
            setCharacterHp((gameState.player.hp / gameState.player.maxHp) * 100);
        } else {
            setCharacterHp(0);
        }

        setInventoryOpen(false);
        setItemPanelOpen(false);
        setChestOpen(false);
    }

    useEffect(() => {
        if (!gameLoaded) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "i") {
                setInventoryOpen(prev => !prev); // toggle
                setItemPanelOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [gameLoaded]);

    useEffect(() => {
        const handler = () => {
            if (scene && scene.player) {
                const hpPercent = (scene?.player.hp / scene?.player.maxHp) * 100;
                setCharacterHp(hpPercent)
            }
        };

        window.addEventListener("player-damaged", handler);

        return () => {
            window.removeEventListener("player-damaged", handler);
        };
    }, [characterHp, scene]);

    useEffect(() => {
        const handler = (e: Event) => {
            const event = e as CustomEvent;

            setChestItems(event.detail.items);
        };

        window.addEventListener("chest-items-updated", handler);

        return () => {
            window.removeEventListener("chest-items-updated", handler);
        };
    }, []);

    useEffect(() => {
        if (scene && scene.player) {
            setCharacterHp((scene.player.hp / scene.player.maxHp) * 100);
        }
    }, [scene]);

    useEffect(() => {
        const handleChestOpened = (e: Event) => {
            const event = e as CustomEvent;

            setChestItems(event.detail.items);
            setChestOpen(true);
            setChest(event.detail.chest)
        };

        window.addEventListener("chest-opened", handleChestOpened);

        return () => {
            window.removeEventListener("chest-opened", handleChestOpened);
        };
    }, []);

    useEffect(() => {
        const handleChestClosed = () => {
            setChestOpen(false);
            setChestItems(null);
            setChest(null);
        };

        window.addEventListener("chest-closed", handleChestClosed);

        return () => {
            window.removeEventListener("chest-closed", handleChestClosed);
        };
    }, []);

    useEffect(() => {
        if (!game) return;

        const handleSceneChanged = (e: Event) => {
            const event = e as CustomEvent<{ sceneName: SceneKey }>;
            const nextSceneName = event.detail.sceneName;

            requestAnimationFrame(() => {
                syncScene(game.currentScene as Scenes, nextSceneName);
            });
        };

        window.addEventListener("scene-changed", handleSceneChanged);

        return () => {
            window.removeEventListener("scene-changed", handleSceneChanged);
        };
    }, [game]);

    return (
        <div id="game-wrapper" className={styles.gameWrapper}>
            <canvas id="game" ref={canvasRef}></canvas>
            {gameLoaded && (
                <>
                    {sceneName === "menu" && game && (
                        <LandingPage
                            game={game}
                        />
                    )}
                    {(isGameScene || isDungeonScene) && (
                        <>
                            <div className={styles.enemiesContainer}>
                            <p id="enemy-count" className={styles.enemyCount}></p>
                            </div>
                            <div className={styles.characterHpWrapper}>
                                <div className={styles.textContainer}>
                                    <p>HP</p>
                                    <p>{scene?.player?.hp} / {scene?.player?.maxHp}</p>
                                </div>
                                <div className={styles.characterHpContainer}>
                                    <div className={styles.characterHp} style={{ width: `${characterHp}%` }}></div>
                                </div>
                            </div>
                            <InventoryUI inventoryOpen={inventoryOpen} inventory={inventory} setInventoryOpen={setInventoryOpen} itemPanelOpen={itemPanelOpen} setItemPanelOpen={setItemPanelOpen} selectedItem={selectedItem} setSelectedItem={setSelectedItem} engine={game} />
                            <ChestUI chest={chest} chestOpen={chestOpen} inventoryOpen={inventoryOpen} inventory={inventory} chestItems={chestItems} setChestItems={setChestItems} scene={scene} />
                            <div className={styles.spawnBtns}>
                                <button id="spawn-enemy-btn" className={styles.spawnEnemyBtn} onClick={() => scene?.spawnEnemy()}>Spawn Enemy</button>
                                <button id="spawn-boss-btn" className={styles.spawnEnemyBtn} onClick={() => scene?.spawnBoss()}>Spawn Boss</button>
                            </div>
                            <div className={styles.overlayFooter}>
                                {inventory && (
                                    <div className={styles.overlayWeaponInfoContainer}>
                                        {inventory.weapon ? (
                                            <>
                                                <div className={styles.overlayImgContainer}>
                                                    <img src={inventory.weapon.icon} />
                                                </div>
                                                {inventory.weapon.magazine ? (
                                                    <div className={styles.overlayMagContainer}>
                                                        <p>{inventory.weapon.magazine?.amount} / {inventory.weapon.magazine?.maxAmount}</p>
                                                    </div>
                                                ) : (
                                                    <div className={styles.overlayMagContainer}>
                                                        <p>No Magazine</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p>No Weapon Equipped</p>
                                        )}
                                    </div>

                                )}
                            </div>
                            <DungeonMenu scene={scene} />
                        </>
                    )}
                </>
            )}

        </div>
    )
}
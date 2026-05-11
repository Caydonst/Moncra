"use client";
import {useEffect, useRef, useState} from "react";
import { getGame } from "../gameInstance";
import type { GameScene } from "../scenes/GameScene";
import {Inventory} from "@/app/ game/inventory/inventory";
import styles from "../page.module.css"
import InventoryUI from "@/app/ game/components/inventoryUI";
import ChestUI from "@/app/ game/components/chestUI";

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [scene, setScene] = useState<GameScene | null>(null);
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [inventoryOpen, setInventoryOpen] = useState<boolean>(false);
    const [itemPanelOpen, setItemPanelOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [ammoAmtState, setAmmoAmtState] = useState(0);
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

            // 🔥 ensure it's real DOM node
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

            const scene = getGame().currentScene as GameScene;
            setScene(scene);
            const inventory = scene.getInventory()
            setInventory(inventory);
        }

        init();

        return () => cleanup?.();
    }, []);

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
        const handler = () => {
            setAmmoAmtState(v => v + 1);
        };

        window.addEventListener("inventory-updated", handler);

        return () => {
            window.removeEventListener("inventory-updated", handler);
        };
    }, []);

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
        if (scene) {
            setCharacterHp(scene.player.hp);
        }
    }, [scene]);

    useEffect(() => {
        const handleChestOpened = (e: Event) => {
            const event = e as CustomEvent;

            setChestItems(event.detail.items);
            setChestOpen(true);
            setChest(event.detail.chest)
            setInventoryOpen(true);
        };

        window.addEventListener("chest-opened", handleChestOpened);

        return () => {
            window.removeEventListener("chest-opened", handleChestOpened);
        };
    }, []);

    useEffect(() => {
        const handleChestClosed = () => {
            setChestOpen(false);
            setInventoryOpen(false);
            setChestItems(null);
            setChest(null);
        };

        window.addEventListener("chest-closed", handleChestClosed);

        return () => {
            window.removeEventListener("chest-closed", handleChestClosed);
        };
    }, []);

    return (
        <div id="game-wrapper" className={styles.gameWrapper}>
            <canvas id="game" ref={canvasRef}></canvas>
            {gameLoaded && (
                <>
                    <div className={styles.enemiesContainer}>
                        <p id="enemy-count" className={styles.enemyCount}></p>
                    </div>
                    <div className={styles.characterHpWrapper}>
                        <div className={styles.textContainer}>
                            <p>HP</p>
                            <p>{scene?.player.hp} / {scene?.player.maxHp}</p>
                        </div>
                        <div className={styles.characterHpContainer}>
                            <div className={styles.characterHp} style={{ width: `${characterHp}%` }}></div>
                        </div>
                    </div>
                    <InventoryUI inventoryOpen={inventoryOpen} inventory={inventory} itemPanelOpen={itemPanelOpen} setItemPanelOpen={setItemPanelOpen} selectedItem={selectedItem} setSelectedItem={setSelectedItem} scene={scene} />
                    <ChestUI chest={chest} chestOpen={chestOpen} inventoryOpen={inventoryOpen} inventory={inventory} chestItems={chestItems} setChestItems={setChestItems} scene={scene} />
                    <div className={styles.spawnBtns}>
                        <button id="spawn-enemy-btn" className={styles.spawnEnemyBtn} onClick={() => scene?.spawnEnemy()}>Spawn Enemy</button>
                        <button id="spawn-boss-btn" className={styles.spawnEnemyBtn} onClick={() => scene?.spawnBoss()}>Spawn Boss</button>
                    </div>
                    <div className={styles.overlayFooter}>
                        {inventory && (
                            <div className={styles.overlayWeaponInfoContainer}>
                                {inventory.primary ? (
                                    <>
                                        <div className={styles.overlayImgContainer}>
                                            <img src={inventory.primary.icon} />
                                        </div>
                                        {inventory.primary.magazine ? (
                                            <div className={styles.overlayMagContainer}>
                                                <p>{inventory.primary.magazine?.amount} / {inventory.primary.magazine?.maxAmount}</p>
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
                </>
            )}

        </div>
    )
}
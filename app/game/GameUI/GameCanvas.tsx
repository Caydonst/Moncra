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
import InventoryUI from "@/app/game/components/inventoryUI/newInventoryUI";
import DungeonMenu from "../components/dungeonMenu/gameplayMenu";
import LandingPage from "../components/landingPage/landingPage";
import { gameState } from "../gameState/gameState";
import StorageUI from "../components/StorageUI/StorageUI";
import BlacksmithUI from "../components/BlacksmithUI/BlacksmithUI";
import LanternImg from "../assets/lantern/lantern_tier3.png"
import { specializationColors } from "../utils/uiUtils";
import { createClientInventory } from "../inventory/createClientInventory";
import ClassResourceUI from "../components/ClassResourceUI/classResource";
import SocialIcon from "@/app/game/assets/icons/social_icon.png"
import SocialUI from "../components/socialUI/socialUI";
import { getInputMode, beginTyping, endTyping } from "../utils/inputUtils";
import GameplayMenu from "../components/dungeonMenu/gameplayMenu";

type Scenes = GameScene | HubScene | MenuScene | TestScene | DungeonScene
type SceneKey = "menu" | "hub" | "game" | "dungeon" | "test";

type Props = {
    username: string;
}

export default function GameCanvas({ username }: Props) {
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
    const [storageOpen, setStorageOpen] = useState(false);
    const [storage, setStorage] = useState(null);
    const [storageData, setStorageData] = useState(null);
    const [blacksmithOpen, setBlacksmithOpen] = useState(false);
    const [socialOpen, setSocialOpen] = useState(false);
    const [playerStats, setPlayerStats] = useState({
            power: 0,
            damage: 0,
            crit: 0,
            armor: 0,
            hp: 100,
            maxHp: 100,
            level: 0,
            currentXp: 0,
            xpToNextLvl: 0,
        });

    useEffect(() => {
        function preventZoomKeys(e: KeyboardEvent) {
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
            ) {
                e.preventDefault();
            }
        }

        function preventZoomWheel(e: WheelEvent) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        }

        window.addEventListener("keydown", preventZoomKeys);
        window.addEventListener("wheel", preventZoomWheel, {
            passive: false,
        });

        return () => {
            window.removeEventListener("keydown", preventZoomKeys);
            window.removeEventListener("wheel", preventZoomWheel);
        };
    }, []);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let cancelled = false;

        async function init() {
            gameState.username = username;

            const canvas = canvasRef.current;

            if (!canvas) return;

            if (!(canvas instanceof HTMLCanvasElement)) {
                console.error("Not a canvas:", canvas);
                return;
            }

            try {
                const { startGame } = await import("../startGame");

                // Do not set gameLoaded inside startGame anymore.
                cleanup = await startGame(canvas);

                if (cancelled) return;

                const game = getGame();

                if (!game) {
                    throw new Error("Game engine was not created.");
                }

                setGame(game);

                await game.goToScene("hub");

                if (cancelled) return;

                syncScene(game.currentScene as Scenes, "hub");

                // Allow React to apply game + scene state first.
                requestAnimationFrame(() => {
                    if (!cancelled) {
                        setGameLoaded(true);
                    }
                });
            } catch (error) {
                console.error("Failed to initialize game:", error);
            }
        }

        void init();

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, []);

    useEffect(() => {
        function handleInventoryUpdated(e: Event) {
            const event = e as CustomEvent;

            const clientInventory = createClientInventory(event.detail, gameState);
            console.log(event.detail);
            gameState.inventory = clientInventory;
            setInventory(clientInventory);

            console.log(clientInventory);
        }

        window.addEventListener("inventory_updated", handleInventoryUpdated);

        return () => {
            window.removeEventListener("inventory_updated", handleInventoryUpdated);
        };
    }, []);

    const isMenuScene = sceneName === "menu";
    const isHubScene = sceneName === "hub";
    const isDungeonScene = sceneName === "dungeon";
    const isGameScene = isHubScene || isDungeonScene || sceneName === "game";

    function syncScene(newScene: Scenes, newSceneName: SceneKey) {
        setScene(newScene);
        setSceneName(newSceneName);

        if (gameState.player) {
            setCharacterHp((gameState.player.getStats().hp / gameState.player.getStats().maxHp) * 100);
        } else {
            setCharacterHp(0);
        }

        setInventoryOpen(false);
        setItemPanelOpen(false);
        setChestOpen(false);
    }

    useEffect(() => {
        if (!gameLoaded) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) return;

            const key = event.key.toLowerCase();
            const inputMode = getInputMode();

            /*
             * While typing, all browser game hotkeys are ignored.
             * Normal input behavior, including Enter and Backspace,
             * still works.
             */
            if (inputMode === "typing") {
                return;
            }

            if (inputMode === "inventory") {
                if (key === "i") {
                    event.preventDefault();
                    event.stopPropagation();

                    setInventoryOpen(false);
                    setItemPanelOpen(false);
                }

                return;
            }

            if (inputMode === "dungeon-menu") {
                if (key === "f") {
                    event.preventDefault();
                    event.stopPropagation();

                    window.dispatchEvent(
                        new CustomEvent("dungeon-menu-open", {
                            detail: {
                                open: false,
                            },
                        })
                    );
                }

                return;
            }

            if (key === "i") {
                event.preventDefault();

                setInventoryOpen(true);
                setItemPanelOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [gameLoaded]);

    useEffect(() => {
        const isTextInput = (
            target: EventTarget | null
        ): target is HTMLElement => {
            return (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                (target instanceof HTMLElement &&
                    target.isContentEditable)
            );
        };

        const handleFocusIn = (event: FocusEvent) => {
            if (!isTextInput(event.target)) return;

            beginTyping();
        };

        const handleFocusOut = (event: FocusEvent) => {
            if (!isTextInput(event.target)) return;

            /*
             * Wait until the browser has assigned the next
             * focused element. This prevents flickering back to
             * gameplay when switching directly between inputs.
             */
            queueMicrotask(() => {
                if (!isTextInput(document.activeElement)) {
                    endTyping();
                }
            });
        };

        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);

        return () => {
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    useEffect(() => {
        const handler = () => {
            if (scene && scene.player) {
                const hpPercent = (scene?.player.stats.hp / scene?.player.stats.maxHp) * 100;
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
            setCharacterHp((scene.player.stats.hp / scene.player.stats.maxHp) * 100);
        }
    }, [scene]);

    useEffect(() => {
        const handleStorageOpened = (e: Event) => {
            const event = e as CustomEvent;

            setStorageOpen(true);
            setStorage(event.detail.storage)
        };

        window.addEventListener("storage-opened", handleStorageOpened);

        return () => {
            window.removeEventListener("storage-opened", handleStorageOpened);
        };
    }, []);

    useEffect(() => {
        const handleStorageClosed = () => {
            setStorageOpen(false);
            setStorage(null);
        };

        window.addEventListener("storage-closed", handleStorageClosed);

        return () => {
            window.removeEventListener("storage-closed", handleStorageClosed);
        };
    }, []);

    useEffect(() => {
        const handleBlacksmithOpened = () => {
            setBlacksmithOpen(true);
        };

        window.addEventListener("blacksmith-opened", handleBlacksmithOpened);

        return () => {
            window.removeEventListener("blacksmith-opened", handleBlacksmithOpened);
        };
    }, []);

    useEffect(() => {
        const handleBlacksmithClosed = () => {
            setBlacksmithOpen(false);
        };

        window.addEventListener("blacksmith-closed", handleBlacksmithClosed);

        return () => {
            window.removeEventListener("blacksmith-closed", handleBlacksmithClosed);
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

    useEffect(() => {
        function handlePlayerStatsUpdated(e: Event) {
            const event = e as CustomEvent;

            setPlayerStats(event.detail);
        }

        window.addEventListener("player_stats_updated", handlePlayerStatsUpdated);

        return () => {
            window.removeEventListener("player_stats_updated", handlePlayerStatsUpdated);
        };
    }, []);



    return (
        <div id="game-wrapper" className={styles.gameWrapper}>
            <canvas id="game" ref={canvasRef}></canvas>
            {gameLoaded && game && (
                <>
                    <div className={styles.enemiesContainer}>
                        <p id="enemy-count" className={styles.enemyCount}></p>
                    </div>
                    <div className={styles.characterHpWrapper}>
                        <div className={styles.characterHpContainer}>
                            <p>{playerStats.hp}</p>
                            <div className={styles.characterHp} style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}></div>
                        </div>
                    </div>
                    <InventoryUI inventoryOpen={inventoryOpen} inventory={inventory} setInventory={setInventory} setInventoryOpen={setInventoryOpen} itemPanelOpen={itemPanelOpen} setItemPanelOpen={setItemPanelOpen} selectedItem={selectedItem} setSelectedItem={setSelectedItem} engine={game} />
                    <StorageUI storageOpen={storageOpen} inventory={inventory} storage={storage} storageData={storageData} setInventory={setInventory} />
                    {blacksmithOpen && (
                        <BlacksmithUI blacksmithOpen={blacksmithOpen} inventory={inventory} setInventory={setInventory} />
                    )}
                    <div className={styles.socialContainer}>
                        <button className={styles.socialBtn} onClick={() => setSocialOpen(true)}>
                            <img src={SocialIcon.src} />
                        </button>
                    </div>
                    <SocialUI socialOpen={socialOpen} setSocialOpen={setSocialOpen} />

                    <div className={styles.overlayFooter}>
                        {/*
                                {inventory && (
                                    <div className={styles.overlayWeaponInfoContainer}>
                                        {inventory.weapon ? (
                                            <>
                                                <div className={styles.overlayImgContainer}>
                                                    <img src={inventory.weapon.icon} />
                                                </div>
                                            </>
                                        ) : (
                                            <p>No Weapon Equipped</p>
                                        )}
                                    </div>

                                )}
                                    */}
                        <div className={styles.lanternContainer}><img src={LanternImg.src} /></div>
                        <ClassResourceUI />
                    </div>
                    <GameplayMenu scene={scene} />
                </>
            )}

        </div>
    )
}
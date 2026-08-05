import { useEffect, useRef, useState } from "react";
import styles from "./newInventory.module.css";
import { Armor, Weapon } from "../../items/ItemTypes";
import { colors } from "../../utils/uiUtils";
import upgradeIcon from "@/app/game/assets/icons/upgrade_button_icon.png";

type GearItem = Weapon | Armor;

type Props = {
    slot: any;
    equipItem: (item: GearItem | null) => void | Promise<void>;
    type: string;
    setSelectedItem: React.Dispatch<React.SetStateAction<any>>;
    setItemInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showItemTooltip: (
        item: GearItem,
        e: React.MouseEvent
    ) => void;
    moveItemTooltip: (e: React.MouseEvent) => void;
    hideItemTooltip: () => void;
    setHoveredItemEquipped: React.Dispatch<React.SetStateAction<boolean>>;
};

type ExtraGearSlotProps = {
    item: GearItem | null;
    equipItem: (item: GearItem | null) => void | Promise<void>;
    setSelectedItem: React.Dispatch<React.SetStateAction<any>>;
    setItemInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showItemTooltip: (
        item: GearItem,
        e: React.MouseEvent
    ) => void;
    moveItemTooltip: (e: React.MouseEvent) => void;
    hideItemTooltip: () => void;

    pendingDismantledUid:
    string | null;

    setPendingDismantledUid:
    React.Dispatch<
        React.SetStateAction<
            string | null
        >
    >;
    setHoveredItemEquipped: React.Dispatch<React.SetStateAction<boolean>>;
};

const EQUIP_ANIMATION_DURATION = 400;
const ITEM_SWAP_TIME = EQUIP_ANIMATION_DURATION / 2;

function ExtraGearSlot({
    item,
    equipItem,
    setSelectedItem,
    setItemInfoOpen,
    showItemTooltip,
    moveItemTooltip,
    hideItemTooltip,
    pendingDismantledUid,
    setPendingDismantledUid,
    setHoveredItemEquipped,
}: ExtraGearSlotProps) {
    /*
     * The item currently visible in this extra slot.
     *
     * When the real item prop changes, this keeps displaying
     * the previous item until the overlay fully covers the slot.
     */
    const [displayedItem, setDisplayedItem] =
        useState<GearItem | null>(item ?? null);

    const [isEquipping, setIsEquipping] =
        useState(false);

    /*
     * Alternates the CSS animation name so rapid equips
     * always restart the animation.
     */
    const [animationCycle, setAnimationCycle] =
        useState<0 | 1>(0);

    const previousItemUidRef =
        useRef<string | null>(item?.uid ?? null);

    /*
     * Prevents callbacks from an older animation from changing
     * the current animation.
     */
    const animationIdRef = useRef(0);

    const swapTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const finishTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const DISMANTLE_HOLD_DURATION = 2000;
    const DISMANTLE_FINISH_DURATION = 400;

    const [isHovered, setIsHovered] =
        useState(false);

    const [isDismantling, setIsDismantling] =
        useState(false);

    const [dismantleProgress, setDismantleProgress] =
        useState(0);

    const dismantleStartRef =
        useRef<number | null>(null);

    const dismantleFrameRef =
        useRef<number | null>(null);

    const dismantledUidRef =
        useRef<string | null>(null);

    const [isDismantleFinishing, setIsDismantleFinishing] =
        useState(false);

    const dismantleFinishTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const cancelDismantle = () => {
        if (dismantleFrameRef.current !== null) {
            cancelAnimationFrame(
                dismantleFrameRef.current
            );

            dismantleFrameRef.current = null;
        }

        dismantleStartRef.current = null;

        setIsDismantling(false);
        setDismantleProgress(0);
    };

    const finishDismantle = (
        itemUid: string
    ) => {
        if (
            dismantledUidRef.current ===
            itemUid
        ) {
            return;
        }

        dismantledUidRef.current =
            itemUid;

        cancelDismantle();
        hideItemTooltip();

        /*
         * Start the animation first.
         */
        setIsDismantleFinishing(true);

        /*
         * Tell every slot that the upcoming inventory update
         * is a compacting dismantle update.
         */
        setPendingDismantledUid(
            itemUid
        );

        if (
            dismantleFinishTimerRef.current
        ) {
            clearTimeout(
                dismantleFinishTimerRef.current
            );
        }

        dismantleFinishTimerRef.current =
            setTimeout(() => {
                void sendDismantleRequest(
                    itemUid
                );
            }, DISMANTLE_FINISH_DURATION);
    };

    const sendDismantleRequest = async (
        itemUid: string
    ) => {
        const { multiplayer } =
            await import(
                "../../network/multiplayer"
            );

        multiplayer.sendDismantleItem(
            itemUid
        );
    };

    const updateDismantleProgress = (
        timestamp: number
    ) => {
        if (
            dismantleStartRef.current === null
        ) {
            return;
        }

        const elapsed =
            timestamp -
            dismantleStartRef.current;

        const progress = Math.min(
            1,
            elapsed / DISMANTLE_HOLD_DURATION
        );

        setDismantleProgress(
            progress
        );

        if (progress >= 1) {
            const itemUid =
                displayedItem?.uid;

            if (itemUid) {
                void finishDismantle(
                    itemUid
                );
            }

            return;
        }

        dismantleFrameRef.current =
            requestAnimationFrame(
                updateDismantleProgress
            );
    };

    const startDismantle = () => {
        if (!displayedItem) return;
        if (!isHovered) return;
        if (isEquipping) return;
        if (isDismantling) return;
        if (isDismantleFinishing) return;

        dismantledUidRef.current = null;

        setIsDismantling(true);
        setDismantleProgress(0);

        dismantleStartRef.current =
            performance.now();

        dismantleFrameRef.current =
            requestAnimationFrame(
                updateDismantleProgress
            );
    };

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key.toLowerCase() !==
                "f"
            ) {
                return;
            }

            /*
             * Ignore keyboard-repeat events.
             */
            if (event.repeat) {
                return;
            }

            if (!isHovered) {
                return;
            }

            if (!displayedItem) {
                return;
            }

            event.preventDefault();

            startDismantle();
        };

        const handleKeyUp = (
            event: KeyboardEvent
        ) => {
            if (
                event.key.toLowerCase() !==
                "f"
            ) {
                return;
            }

            if (!isDismantling) {
                return;
            }

            event.preventDefault();

            cancelDismantle();
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        window.addEventListener(
            "keyup",
            handleKeyUp
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            window.removeEventListener(
                "keyup",
                handleKeyUp
            );
        };
    }, [
        displayedItem,
        isHovered,
        isEquipping,
        isDismantling,
    ]);

    useEffect(() => {
        return () => {
            if (
                dismantleFrameRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    dismantleFrameRef.current
                );
            }

            if (
                dismantleFinishTimerRef.current
            ) {
                clearTimeout(
                    dismantleFinishTimerRef.current
                );
            }
        };
    }, []);

    useEffect(() => {
        cancelDismantle();
        dismantledUidRef.current = null;
    }, [item?.uid]);

    useEffect(() => {
        const newItemUid =
            item?.uid ?? null;

        const previousItemUid =
            previousItemUidRef.current;

        /*
         * The dismantle hold just finished, but the server has
         * not changed this slot yet.
         *
         * Keep the dismantle finishing animation running.
         */
        if (
            pendingDismantledUid &&
            newItemUid === previousItemUid
        ) {
            return;
        }

        /*
         * The server inventory update arrived and compacted
         * the array. Update shifted slots immediately without
         * playing their equip animation.
         */
        if (
            pendingDismantledUid &&
            newItemUid !== previousItemUid
        ) {
            previousItemUidRef.current =
                newItemUid;

            setDisplayedItem(
                item ?? null
            );

            setIsEquipping(false);
            setIsDismantleFinishing(false);

            return;
        }

        /*
         * Same item, but its stats changed.
         */
        if (
            newItemUid === previousItemUid
        ) {
            setDisplayedItem(
                item ?? null
            );

            return;
        }

        previousItemUidRef.current =
            newItemUid;

        const animationId =
            ++animationIdRef.current;

        if (swapTimerRef.current) {
            clearTimeout(
                swapTimerRef.current
            );
        }

        if (finishTimerRef.current) {
            clearTimeout(
                finishTimerRef.current
            );
        }

        setIsEquipping(true);

        setAnimationCycle(previous =>
            previous === 0 ? 1 : 0
        );

        swapTimerRef.current =
            setTimeout(() => {
                if (
                    animationIdRef.current !==
                    animationId
                ) {
                    return;
                }

                setDisplayedItem(
                    item ?? null
                );
            }, ITEM_SWAP_TIME);

        finishTimerRef.current =
            setTimeout(() => {
                if (
                    animationIdRef.current !==
                    animationId
                ) {
                    return;
                }

                setIsEquipping(false);
            }, EQUIP_ANIMATION_DURATION);

        return () => {
            if (swapTimerRef.current) {
                clearTimeout(
                    swapTimerRef.current
                );
            }

            if (finishTimerRef.current) {
                clearTimeout(
                    finishTimerRef.current
                );
            }
        };
    }, [
        item,
        pendingDismantledUid,
    ]);

    const progressPercentage =
        Math.min(
            100,
            Math.floor(
                dismantleProgress * 100
            )
        );

    const xpPercentage = displayedItem
        ? Math.min(
            100,
            Math.max(
                0,
                (displayedItem.currentXp /
                    displayedItem.nextLvlXp) *
                100
            )
        )
        : 0;

    return (
        <div
            className={`
                ${styles.extraSlot}

                ${isEquipping
                                ? animationCycle === 0
                                    ? styles.equippingA
                                    : styles.equippingB
                                : ""
                            }

                ${isDismantleFinishing
                                ? styles.dismantleFinishing
                                : ""
                            }
            `}
            onClick={async () => {
                if (!displayedItem) return;
                if (isDismantling) return;
                if (isDismantleFinishing) return;

                await equipItem(displayedItem);
            }}
            style={{
                background:
                    colors[displayedItem?.rarity]
                        ?.hex ?? "transparent",

                borderColor:
                    colors[displayedItem?.rarity]
                        ?.hex ?? "#202020",
            }}
            onMouseEnter={e => {
                setIsHovered(true);

                if (!displayedItem) return;

                showItemTooltip(
                    displayedItem,
                    e
                );

                setHoveredItemEquipped(false);
            }}

            onMouseMove={moveItemTooltip}

            onMouseLeave={() => {
                setIsHovered(false);
                hideItemTooltip();
                cancelDismantle();
            }}
            onContextMenu={e => {
                e.preventDefault();

                if (!displayedItem) return;
                if (isDismantling) return;
                if (isDismantleFinishing) return;

                setSelectedItem(displayedItem);
                setItemInfoOpen(true);
                hideItemTooltip();
            }}
        >
            {displayedItem && (
                <>
                    <div
                        className={
                            styles.gearSlotIconContainer
                        }
                    >
                        <img
                            src={displayedItem.icon}
                            className={
                                displayedItem.type ===
                                    "Weapon"
                                    ? styles.gearWeaponImg
                                    : styles.gearOtherImg
                            }
                            alt={displayedItem.name}
                        />
                    </div>

                    <div
                        className={
                            styles.weaponXpContainer
                        }
                    >
                        <div
                            className={
                                styles.weaponXp
                            }
                            style={{
                                width: `${xpPercentage}%`,
                            }}
                        />
                    </div>

                    {displayedItem.availableUpgradePoints >
                        0 && (
                            <div
                                className={
                                    styles.levelAvailableContainer
                                }
                            >
                                <img
                                    src={upgradeIcon.src}
                                    alt="Upgrade available"
                                />
                            </div>
                        )}
                </>
            )}

            {isDismantling && (
                <div
                    className={
                        styles.dismantleOverlay
                    }
                >
                    <div
                        className={
                            styles.dismantleProgress
                        }
                        style={{
                            height:
                                `${progressPercentage}%`,
                        }}
                    />
                </div>
            )}

            {isDismantleFinishing && (
                <div
                    className={
                        styles.dismantleWhiteOverlay
                    }
                />
            )}
        </div>
    );
}

export default function ExtraSlot({
    slot,
    equipItem,
    type,
    setSelectedItem,
    setItemInfoOpen,
    showItemTooltip,
    moveItemTooltip,
    hideItemTooltip,
    setHoveredItemEquipped,
}: Props) {
    const [
        pendingDismantledUid,
        setPendingDismantledUid,
    ] = useState<string | null>(null);

    useEffect(() => {
        if (!pendingDismantledUid) {
            return;
        }

        const uidStillExists =
            slot.extras.some(
                (extraItem: GearItem | null) =>
                    extraItem?.uid ===
                    pendingDismantledUid
            );

        /*
         * The updated inventory has arrived and the dismantled
         * item is gone, so shifted slots may animate normally again.
         */
        if (!uidStillExists) {
            setPendingDismantledUid(null);
        }
    }, [
        slot.extras,
        pendingDismantledUid,
    ]);
    return (
        <div
            className={
                type === "Weapon"
                    ? styles.weaponSlotExtras
                    : styles.armorSlotExtras
            }
        >
            {slot.extras.map(
                (
                    extraItem: GearItem | null,
                    extraIndex: number
                ) => (
                    <ExtraGearSlot
                        /*
                         * Keep the index as the key because this component
                         * represents a permanent inventory position.
                         *
                         * Do not use extraItem.uid as the key here. Doing so
                         * would remount the component whenever its item changes,
                         * preventing it from retaining the previous item.
                         */
                        key={extraIndex}
                        item={extraItem}
                        equipItem={equipItem}
                        setSelectedItem={
                            setSelectedItem
                        }
                        setItemInfoOpen={
                            setItemInfoOpen
                        }
                        showItemTooltip={
                            showItemTooltip
                        }
                        moveItemTooltip={
                            moveItemTooltip
                        }
                        hideItemTooltip={
                            hideItemTooltip
                        }
                        pendingDismantledUid={
                            pendingDismantledUid
                        }

                        setPendingDismantledUid={
                            setPendingDismantledUid
                        }
                        setHoveredItemEquipped={setHoveredItemEquipped}
                    />
                )
            )}
        </div>
    );
}
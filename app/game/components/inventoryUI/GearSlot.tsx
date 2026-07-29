import { useEffect, useRef, useState } from "react";
import styles from "./newInventory.module.css";
import { colors } from "../../utils/uiUtils";
import { Weapon, Armor } from "../../items/ItemTypes";
import lockIcon from "@/app/game/assets/icons/lock_icon.png";
import upgradeIcon from "@/app/game/assets/icons/upgrade_button_icon.png";

type GearItem = Weapon | Armor;

type Props = {
    slotIndex: number;
    item: GearItem | null;
    selectedSlot: any;
    openItemPanel: any;
    setSelectedSlot: any;
    setSelectedItem: React.Dispatch<
        React.SetStateAction<any>
    >;
    setItemInfoOpen: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    showItemTooltip: (
        item: GearItem,
        e: React.MouseEvent
    ) => void;
    moveItemTooltip: (
        e: React.MouseEvent
    ) => void;
    hideItemTooltip: () => void;
};

const EQUIP_ANIMATION_DURATION = 400;
const ITEM_SWAP_TIME =
    EQUIP_ANIMATION_DURATION / 2;

export function GearSlot({
    slotIndex,
    item,
    selectedSlot,
    setSelectedSlot,
    setSelectedItem,
    setItemInfoOpen,
    showItemTooltip,
    moveItemTooltip,
    hideItemTooltip,
}: Props) {
    /*
     * The item currently rendered inside the slot.
     *
     * This intentionally updates later than the actual item prop
     * so the previous item remains visible during the first half
     * of the equip animation.
     */
    const indexToType: Record<number, string> = {
        0: "Weapon",
        4: "Helmet",
        5: "Arms",
        6: "Chest",
        7: "Legs",
    };

    const [displayedItem, setDisplayedItem] =
        useState<GearItem | null>(item ?? null);

    const [isEquipping, setIsEquipping] =
        useState(false);

    /*
     * Alternates between two identical CSS animations.
     * Changing animation-name forces the browser to restart it.
     */
    const [animationCycle, setAnimationCycle] =
        useState<0 | 1>(0);

    const previousItemUidRef =
        useRef<string | null>(item?.uid ?? null);

    const animationIdRef = useRef(0);

    const swapTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const finishTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const newItemUid = item?.uid ?? null;
        const previousItemUid = previousItemUidRef.current;

        /*
         * Same item, but its XP, level, stats, or upgrade points changed.
         * Update the displayed version without playing the equip animation.
         */
        if (newItemUid === previousItemUid) {
            setDisplayedItem(item ?? null);
            return;
        }

        previousItemUidRef.current = newItemUid;

        const animationId = ++animationIdRef.current;

        if (swapTimerRef.current) {
            clearTimeout(swapTimerRef.current);
        }

        if (finishTimerRef.current) {
            clearTimeout(finishTimerRef.current);
        }

        setIsEquipping(true);

        setAnimationCycle(previous =>
            previous === 0 ? 1 : 0
        );

        swapTimerRef.current = setTimeout(() => {
            if (animationIdRef.current !== animationId) {
                return;
            }

            setDisplayedItem(item ?? null);
        }, ITEM_SWAP_TIME);

        finishTimerRef.current = setTimeout(() => {
            if (animationIdRef.current !== animationId) {
                return;
            }

            setIsEquipping(false);
        }, EQUIP_ANIMATION_DURATION);

        return () => {
            if (swapTimerRef.current) {
                clearTimeout(swapTimerRef.current);
            }

            if (finishTimerRef.current) {
                clearTimeout(finishTimerRef.current);
            }
        };
    }, [item]);

    function openGearPieceOverview(
        selectedGearItem: GearItem
    ) {
        setSelectedItem(selectedGearItem);
        setItemInfoOpen(true);
        hideItemTooltip();
    }

    const xpPercentage = displayedItem
        ? Math.min(
            100,
            (displayedItem.currentXp /
                displayedItem.nextLvlXp) *
            100
        )
        : 0;

    return (
        <div
            className={`
                ${styles.gearSlot}

                ${selectedSlot.displayIndex === slotIndex &&
                                selectedSlot.filter === "equipment"
                                ? styles.selected
                                : ""
                            }

                ${isEquipping
                                ? animationCycle === 0
                                    ? styles.equippingA
                                    : styles.equippingB
                                : ""
                            }
            `}
            style={{
                background:
                    colors[displayedItem?.rarity]
                        ?.hex ?? "transparent",

                borderColor:
                    colors[displayedItem?.rarity]
                        ?.hex ??
                    "rgba(255, 255, 255, 0.2)",
            }}
            onClick={() => {
                if (!displayedItem) return;

                setSelectedSlot({
                    filter: "equipment",
                    displayIndex: slotIndex,
                    realIndex: -1,
                    itemId: displayedItem.uid,
                });
            }}
            onMouseEnter={e => {
                if (!displayedItem) return;

                showItemTooltip(
                    displayedItem,
                    e
                );
            }}
            onMouseMove={moveItemTooltip}
            onMouseLeave={hideItemTooltip}
            onContextMenu={e => {
                e.preventDefault();

                if (!displayedItem) return;

                openGearPieceOverview(
                    displayedItem
                );
            }}
        >
            {displayedItem ? (
                <>
                    <div className={styles.gearSlotIconContainer}>
                        {displayedItem.type === "Weapon" ? (
                            <img
                                src={displayedItem.icon}
                                className={styles.gearWeaponImg}
                                alt={displayedItem.name}
                            />
                        ) : displayedItem.type === "Lantern" ? (
                            <img
                                src={displayedItem.icon}
                                className={styles.gearLanternImg}
                                alt={displayedItem.name}
                            />
                        ) : (
                            <img
                                src={displayedItem.icon}
                                className={styles.gearOtherImg}
                                alt={displayedItem.name}
                            />
                        )}
                    </div>

                    {displayedItem.currentXp && (
                        <div className={styles.weaponXpContainer}>
                        <div
                            className={styles.weaponXp}
                            style={{width: `${xpPercentage}%`,}}
                        />
                    </div>
                    )}

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
            ) : indexToType[slotIndex] !==
                undefined ? (
                <div
                    className={
                        styles.gearSlotEmptyContainer
                    }
                >
                    <p
                        className={
                            styles.noneText
                        }
                    >
                        {indexToType[slotIndex]}
                    </p>
                </div>
            ) : (
                <div
                    className={
                        styles.gearSlotEmptyContainer
                    }
                >
                    <img
                        src={lockIcon.src}
                        alt="Locked"
                    />
                </div>
            )}
        </div>
    );
}
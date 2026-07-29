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
            `}
            onClick={async () => {
                if (!displayedItem) return;

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
}: Props) {
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
                    />
                )
            )}
        </div>
    );
}
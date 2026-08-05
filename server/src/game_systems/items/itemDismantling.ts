import { ServerInventory } from "../inventory/inventoryTypes.js";

type DismantleLocation =
    | {
        collection:
        "miscWeapons";
        index: number;
        item:
        NonNullable<
            ServerInventory[
            "miscWeapons"
            ][number]
        >;
    }
    | {
        collection:
        "miscArmor";
        index: number;
        item:
        NonNullable<
            ServerInventory[
            "miscArmor"
            ][number]
        >;
    };

function findDismantleLocation(
    inventory: ServerInventory,
    uid: string
): DismantleLocation | null {
    const weaponIndex =
        inventory.miscWeapons.findIndex(
            item => item?.uid === uid
        );

    if (weaponIndex >= 0) {
        const item =
            inventory.miscWeapons[
            weaponIndex
            ];

        if (item) {
            return {
                collection:
                    "miscWeapons",
                index:
                    weaponIndex,
                item,
            };
        }
    }

    const armorIndex =
        inventory.miscArmor.findIndex(
            item => item?.uid === uid
        );

    if (armorIndex >= 0) {
        const item =
            inventory.miscArmor[
            armorIndex
            ];

        if (item) {
            return {
                collection:
                    "miscArmor",
                index:
                    armorIndex,
                item,
            };
        }
    }

    return null;
}

export function dismantleItem(
    inventory: ServerInventory,
    uid: string
) {
    const location =
        findDismantleLocation(
            inventory,
            uid
        );

    if (!location) {
        return {
            ok: false as const,
            error:
                `Item "${uid}" was not found in extra slots.`,
        };
    }

    if (
        location.collection ===
        "miscWeapons"
    ) {
        inventory.miscWeapons[
            location.index
        ] = null;
    } else {
        inventory.miscArmor[
            location.index
        ] = null;
    }

    return {
        ok: true as const,
        item:
            location.item,
        category:
            location.collection,
        index:
            location.index,
    };
}
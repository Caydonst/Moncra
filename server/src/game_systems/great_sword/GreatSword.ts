import {
    GreatSwordState
} from "../../schemas/GameState.js";

export type WeaponAttackType = "normal" | "heavy";

export type AttackType = "slash" | "thrust";

export type GreatSwordAttack = {
    type: AttackType;
    duration: number;
    cooldown: number;
    damageMultiplier: number;
    startOffset?: number;
    endOffset?: number;
    swingFlip?: boolean;
    thrustDistance?: number;
};

export type WeaponAttackInput = {
    weaponId: string;
    aimAngle: number;
    attackType: WeaponAttackType;
    clientAttackId: number;
};

export type ServerPlayerCombatState = {
    x: number;
    y: number;
    weaponId: string;
    greatSword: GreatSwordState;
};

const combo: GreatSwordAttack[] = [
    {
        type: "slash",
        duration: 400,
        cooldown: 350,
        damageMultiplier: 1,
        startOffset: Math.PI / 1.5,
        endOffset: -Math.PI / 1.5,
        swingFlip: false,
    },
    {
        type: "slash",
        duration: 400,
        cooldown: 350,
        damageMultiplier: 1,
        startOffset: -Math.PI / 1.5,
        endOffset: Math.PI / 1.5,
        swingFlip: true,
    },
    {
        type: "slash",
        duration: 400,
        cooldown: 350,
        damageMultiplier: 1,
        startOffset: -Math.PI / 1.5,
        endOffset: Math.PI / 1.5,
        swingFlip: true,
    },
    {
        type: "thrust",
        duration: 400,
        cooldown: 350,
        damageMultiplier: 1.5,
        thrustDistance: 15,
    },
];

const COMBO_THRESHOLD = 600;

const heavyAttack: GreatSwordAttack = {
    type: "slash",
    duration: 650,
    cooldown: 1000,
    damageMultiplier: 2.5,
    startOffset: Math.PI / 1.25,
    endOffset: -Math.PI / 1.25,
    swingFlip: false,
};

export function createGreatSwordState(): GreatSwordState {
    const state = new GreatSwordState();

    state.comboIndex = 0;
    state.lastNormalAttackTime = 0;
    state.lastHeavyAttackTime = 0;
    state.lastComboTime = 0;
    state.lastAttackTime = 0;
    state.attackId = 0;

    state.hitTargets.clear();

    return state;
}

export function handleGreatSwordAttack(
    player: ServerPlayerCombatState,
    input: WeaponAttackInput,
    now = Date.now()
) {
    if (input.weaponId !== player.weaponId) {
        console.log("INPUT WEAPONID: ", input.weaponId);
        console.log("PLAYER WEAPONID: ", player.weaponId);
        return null;
    }

    const state = player.greatSword;

    if (input.attackType === "heavy") {
        return handleHeavyGreatSwordAttack(
            player,
            input,
            now
        );
    }

    return handleNormalGreatSwordAttack(
        player,
        input,
        now
    );
}

function handleNormalGreatSwordAttack(
    player: ServerPlayerCombatState,
    input: WeaponAttackInput,
    now: number
) {
    const state = player.greatSword;

    if (
        now - state.lastComboTime >
        COMBO_THRESHOLD
    ) {
        state.comboIndex = 0;
    }

    const attack =
        combo[state.comboIndex];

    console.log("NORMAL ATTACK COOLDOWN CHECK", {
        comboIndex: state.comboIndex,
        attackType: attack.type,
        elapsed: now - state.lastNormalAttackTime,
        required: attack.cooldown,
    });

    if (
        now - state.lastNormalAttackTime <
        attack.cooldown
    ) {
        return null;
    }

    state.lastNormalAttackTime = now;
    state.lastComboTime = now;

    state.attackId++;

    const serverAttackId =
        state.attackId;

    const comboIndex =
        state.comboIndex;

    state.comboIndex =
        (state.comboIndex + 1) %
        combo.length;

    state.hitTargets.clear();

    return {
        serverAttackId,
        clientAttackId:
            input.clientAttackId,

        weaponId:
            input.weaponId,

        x: player.x,
        y: player.y,

        aimAngle:
            input.aimAngle,

        inputAttackType:
            input.attackType,

        comboIndex,
        attack,
    };
}

function handleHeavyGreatSwordAttack(
    player: ServerPlayerCombatState,
    input: WeaponAttackInput,
    now: number
) {
    const state = player.greatSword;

    console.log("HEAVY ATTACK COOLDOWN CHECK", {
        elapsed: now - state.lastHeavyAttackTime,
        required: heavyAttack.cooldown,
    });

    if (
        now - state.lastHeavyAttackTime <
        heavyAttack.cooldown
    ) {
        return null;
    }

    state.lastHeavyAttackTime = now;
    state.lastComboTime = now;

    state.attackId++;

    const serverAttackId =
        state.attackId;

    state.comboIndex = 0;
    state.hitTargets.clear();

    return {
        serverAttackId,
        clientAttackId:
            input.clientAttackId,

        weaponId:
            input.weaponId,

        x: player.x,
        y: player.y,

        aimAngle:
            input.aimAngle,

        inputAttackType:
            input.attackType,

        comboIndex: -1,
        attack: heavyAttack,
    };
}

export function canGreatSwordHit(
    state: GreatSwordState,
    targetId: string,
    attackId: number
) {
    if (attackId !== state.attackId) return false;
    if (state.hitTargets.has(targetId)) return false;

    state.hitTargets.add(targetId);
    return true;
}
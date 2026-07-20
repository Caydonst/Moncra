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

export type GreatSwordState = {
    comboIndex: number;
    lastAttackTime: number;
    lastComboTime: number;
    attackId: number;
    hitTargets: Set<string>;
};

export type WeaponAttackInput = {
    weaponId: string;
    aimAngle: number;
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
        damageMultiplier: 1.2,
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

export function createGreatSwordState(): GreatSwordState {
    return {
        comboIndex: 0,
        lastAttackTime: 0,
        lastComboTime: 0,
        attackId: 0,
        hitTargets: new Set(),
    };
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

    if (now - state.lastComboTime > COMBO_THRESHOLD) {
        state.comboIndex = 0;
    }

    const attack = combo[state.comboIndex];

    console.log("COOLDOWN CHECK", {
        comboIndex: state.comboIndex,
        attackType: attack.type,
        elapsed: now - state.lastAttackTime,
        required: attack.cooldown,
    });

    if (now - state.lastAttackTime < attack.cooldown) {
        return null;
    }

    state.lastAttackTime = now;
    state.lastComboTime = now;
    state.attackId++;

    const comboIndex = state.comboIndex;
    state.comboIndex = (state.comboIndex + 1) % combo.length;

    return {
        attackId: state.attackId,
        weaponId: input.weaponId,
        x: player.x,
        y: player.y,
        aimAngle: input.aimAngle,

        comboIndex,
        attack,
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
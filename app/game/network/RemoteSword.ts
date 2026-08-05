import * as ex from "excalibur";
import { GameResources } from "../resources";
import { Shadow } from "../utils/shadow";
import {
  SwingTracer,
  ThrustTracer,
  HeavySlashProjectile,
  type Attack,
} from "../weapons/sword";
import { EnchantedGlowEffect } from "../utils/swordOutline";

type RemotePlayerLike = ex.Actor & {
  bobOffsetY?: number;
};

export type RemoteAttackData = {
  attackType?: "normal" | "heavy";
  comboIndex?: number;
  attack?: Attack;
  aimAngle?: number;

  attackId?: number;
  clientAttackId?: number;
  serverAttackId?: number;
};

export class RemoteSword extends ex.Actor {
  private engine!: ex.Engine;

  private shadow!: Shadow;
  private swingTracer!: SwingTracer;
  private thrustTracer!: ThrustTracer;

  private offset = ex.vec(45, 0);

  private swinging = false;
  private thrusting = false;

  private swingProgress = 0;
  private swingDuration = 250;

  private swingStartAngle = 0;
  private swingEndAngle = 0;

  private swingStartOffset = 0;
  private swingEndOffset = 0;

  private orbitAngle = 0;
  private idleOrbitAngleOffset = Math.PI / 1.5;

  private thrustDirection = ex.vec(0, 0);
  private thrustDistance = 15;

  private aimAngle = 0;
  private smoothedAimAngle = 0;

  private comboIndex = 0;
  private lastAttackTime = 0;
  private comboThreshold = 600;

  private currentAttack!: Attack;

  private readonly ROT_OFFSET = Math.PI / 2;

  private readonly combo: Attack[] = [
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

  private heavyAttacking = false;
  private heavyAttackProgress = 0;
  private heavyAttackAimAngle = 0;
  private heavySlashSpawned = false;

  private readonly HEAVY_ATTACK_DURATION = 650;
  private readonly HEAVY_ATTACK_RELEASE_TIME = 360;
  private readonly HEAVY_SLASH_DISTANCE = 420;
  private readonly HEAVY_SLASH_SPEED = 900;

  private pendingAttack: RemoteAttackData | null = null;

  private cleanedUp = false;

  constructor(
    private player: RemotePlayerLike,
    private resources: GameResources,
    private image: ex.ImageSource
  ) {
    super({
      name: "remote-sword",
      pos: player.pos.clone(),
      anchor: ex.vec(0.5, 0.5),
      width: image.width * 2.6,
      height: image.height * 2.6,
      z: 4,
      collisionType: ex.CollisionType.PreventCollision,
    });
  }

  onInitialize(engine: ex.Engine) {
    this.engine = engine;

    const sprite = this.image.toSprite();
    sprite.width = this.width;
    sprite.height = this.height;

    this.graphics.use(sprite);

    //const effect = new EnchantedGlowEffect(engine);

    //this.graphics.material = effect.material;

    this.shadow = new Shadow(this);
    engine.currentScene.add(this.shadow);

    this.swingTracer =
      new SwingTracer();

    engine.currentScene.add(
      this.swingTracer
    );

    this.thrustTracer =
      new ThrustTracer();

    engine.currentScene.add(
      this.thrustTracer
    );
  }

  private hasReceivedAim = false;

  setAimAngle(aimAngle: number): void {
    if (!Number.isFinite(aimAngle)) {
      return;
    }

    this.aimAngle = aimAngle;

    if (!this.hasReceivedAim) {
      this.smoothedAimAngle =
        aimAngle;

      this.hasReceivedAim = true;
    }
  }

  public playAttack(
    data: RemoteAttackData
  ): void {
    this.aimAngle =
      data.aimAngle ?? this.aimAngle;

    /*
     * Heavy attacks take priority and can replace
     * the current normal attack.
     */
    if (data.attackType === "heavy") {
      this.pendingAttack = null;

      this.swinging = false;
      this.thrusting = false;
      this.swingProgress = 0;

      this.startHeavyAttack(
        data.aimAngle ?? this.aimAngle
      );

      return;
    }

    /*
     * Do not discard a combo message.
     * Save it until the current animation finishes.
     */
    if (
      this.swinging ||
      this.thrusting ||
      this.heavyAttacking
    ) {
      this.pendingAttack = data;
      return;
    }

    this.startRemoteNormalAttack(data);
  }

  private startRemoteNormalAttack(
    data: RemoteAttackData
  ): void {
    const receivedComboIndex =
      data.comboIndex;

    const comboIndex =
      typeof receivedComboIndex === "number" &&
        receivedComboIndex >= 0 &&
        receivedComboIndex < this.combo.length
        ? receivedComboIndex
        : this.comboIndex;

    const attack =
      data.attack ??
      this.combo[comboIndex];

    if (!attack) {
      console.warn(
        "Remote attack missing attack data:",
        data
      );

      return;
    }

    this.currentAttack = attack;
    this.lastAttackTime =
      performance.now();

    if (attack.type === "slash") {
      this.startSlash(
        attack,
        data.aimAngle ?? this.aimAngle
      );
    } else {
      this.startThrust(
        attack,
        data.aimAngle ?? this.aimAngle
      );
    }

    this.comboIndex =
      (comboIndex + 1) %
      this.combo.length;
  }

  private playPendingAttack(): void {
    if (!this.pendingAttack) {
      return;
    }

    const nextAttack =
      this.pendingAttack;

    this.pendingAttack = null;

    this.startRemoteNormalAttack(
      nextAttack
    );
  }

  private startSlash(attack: Attack, aimAngle: number) {
    this.swinging = true;
    this.thrusting = false;
    this.swingProgress = 0;

    this.swingDuration =
      Number.isFinite(attack.duration) && attack.duration > 0
        ? attack.duration
        : 250;

    this.graphics.flipHorizontal = attack.swingFlip ?? false;

    this.swingStartOffset = Number.isFinite(attack.startOffset)
      ? attack.startOffset!
      : 0;

    this.swingEndOffset = Number.isFinite(attack.endOffset)
      ? attack.endOffset!
      : 0;

    this.swingStartAngle = aimAngle + this.swingStartOffset;
    this.swingEndAngle = aimAngle + this.swingEndOffset;

    this.idleOrbitAngleOffset = this.swingEndOffset;
    this.orbitAngle = this.swingStartAngle;

    this.swingTracer.start(
      this.player,
      this.swingStartOffset,
      this.swingEndOffset,
      this.swingDuration,
      this.offset.x,
      () =>
        this.player.pos
          .clone()
          .add(ex.vec(0, this.player.bobOffsetY ?? 0))
          .add(ex.vec(0, 5)),
      () => this.aimAngle
    );
  }

  private startThrust(attack: Attack, aimAngle: number) {
    this.thrusting = true;
    this.swinging = false;
    this.swingProgress = 0;

    this.swingDuration = attack.duration;
    this.thrustDirection = ex.Vector.fromAngle(aimAngle);
    this.thrustDistance = attack.thrustDistance ?? 55;

    const base = this.player.pos
      .clone()
      .add(this.thrustDirection.scale(this.height * 0.35))
      .add(ex.vec(0, this.player.bobOffsetY ?? 0))
      .add(ex.vec(0, 5));

    const tipStart = base.add(
      this.thrustDirection.scale(this.height - 50)
    );

    const tipEnd = tipStart.add(
      this.thrustDirection.scale(this.thrustDistance + 35)
    );

    this.thrustTracer.startTrace(tipStart, tipEnd, aimAngle);
  }

  private startHeavyAttack(
    aimAngle: number
  ): void {
    this.swinging = false;
    this.thrusting = false;
    this.swingProgress = 0;

    this.heavyAttacking = true;
    this.heavyAttackProgress = 0;
    this.heavyAttackAimAngle =
      aimAngle;
    this.heavySlashSpawned = false;

    this.swingStartOffset =
      Math.PI * 0.9;

    this.swingEndOffset =
      -Math.PI * 0.9;

    this.graphics.flipHorizontal =
      false;

    this.orbitAngle =
      aimAngle +
      this.swingStartOffset;

    this.swingTracer.start(
      this.player,
      this.swingStartOffset,
      this.swingEndOffset,
      this.HEAVY_ATTACK_DURATION,
      this.offset.x,
      () =>
        this.player.pos
          .clone()
          .add(
            ex.vec(
              0,
              this.player.bobOffsetY ?? 0
            )
          )
          .add(ex.vec(0, 5)),
      () => this.aimAngle
    );
  }

  onPostUpdate(
    engine: ex.Engine,
    delta: number
  ): void {
    this.swingTracer?.updateTracer(
      engine,
      delta
    );

    this.thrustTracer?.updateTracer(
      engine,
      delta
    );

    // Keep the remote sword's idle aim synced.
    const aimLerpSpeed = 15;

    const aimT =
      1 -
      Math.exp(
        -aimLerpSpeed *
        (delta / 1000)
      );

    this.smoothedAimAngle =
      this.lerpAngle(
        this.smoothedAimAngle,
        this.aimAngle,
        aimT
      );

    if (this.heavyAttacking) {
      this.updateHeavyAttack(delta);
      return;
    }

    if (this.thrusting) {
      this.updateThrust(delta);
      return;
    }

    if (this.swinging) {
      this.updateSwing(delta);
      return;
    }

    this.updateIdle();
  }

  private updateSwing(delta: number) {
    this.swingProgress += delta;

    const t = Math.min(this.swingProgress / this.swingDuration, 1);
    const eased = this.heavySwingEase(t);

    const dynamicStartAngle = this.aimAngle + this.swingStartOffset;
    const dynamicEndAngle = this.aimAngle + this.swingEndOffset;

    this.orbitAngle =
      dynamicStartAngle +
      (dynamicEndAngle - dynamicStartAngle) * eased;

    const rotatedOffset = this.offset
      .clone()
      .rotate(this.orbitAngle)
      .add(ex.vec(0, 5));

    this.pos = this.player.pos
      .clone()
      .add(rotatedOffset)
      .add(ex.vec(0, this.player.bobOffsetY ?? 0));

    this.rotation = this.orbitAngle + this.ROT_OFFSET;

    this.updateShadow();

    if (t >= 1) {
      this.swinging = false;
      this.swingProgress = 0;

      this.idleOrbitAngleOffset =
        this.swingEndOffset;

      this.smoothedAimAngle =
        this.aimAngle;

      this.orbitAngle =
        this.aimAngle +
        this.idleOrbitAngleOffset;

      this.playPendingAttack();
    }
  }

  private updateIdle() {
    this.orbitAngle = this.smoothedAimAngle + this.idleOrbitAngleOffset;

    const rotatedOffset = this.offset
      .clone()
      .rotate(this.orbitAngle)
      .add(ex.vec(0, 5));

    this.pos = this.player.pos
      .clone()
      .add(rotatedOffset)
      .add(ex.vec(0, this.player.bobOffsetY ?? 0));

    this.rotation = this.orbitAngle + this.ROT_OFFSET;

    this.updateShadow();
  }

  private updateThrust(delta: number) {
    this.swingProgress += delta;

    const forwardTime = 45;
    const retractTime = 100;
    const total = this.swingDuration;
    const pauseTime = Math.max(0, total - forwardTime - retractTime);

    const t = Math.min(this.swingProgress, total);

    let thrustT = 0;

    if (t < forwardTime) {
      const p = t / forwardTime;
      thrustT = p * p * (3 - 2 * p);
    } else if (t < forwardTime + pauseTime) {
      thrustT = 1;
    } else {
      const p = (t - forwardTime - pauseTime) / retractTime;
      thrustT = 1 - p * p * (3 - 2 * p);
    }

    const baseOffset = this.thrustDirection.scale(this.height * 0.4);
    const thrustOffset = this.thrustDirection.scale(
      this.thrustDistance * thrustT
    );

    this.pos = this.player.pos
      .clone()
      .add(baseOffset)
      .add(thrustOffset)
      .add(ex.vec(0, this.player.bobOffsetY ?? 0))
      .add(ex.vec(0, 5));

    this.rotation = this.thrustDirection.toAngle() + this.ROT_OFFSET;

    const thrustAngle = this.thrustDirection.toAngle();

    const swordTipStart = this.pos.clone().add(
      this.thrustDirection.scale(this.height * 0.25)
    );

    const swordTipEnd = swordTipStart.clone().add(
      this.thrustDirection.scale(this.thrustDistance + 35)
    );

    this.thrustTracer.updateTrace(
      swordTipStart,
      swordTipEnd,
      thrustAngle
    );

    this.updateShadow();

    if (this.swingProgress >= total) {
      this.thrusting = false;
      this.swingProgress = 0;

      this.playPendingAttack();
    }
  }

  private updateHeavyAttack(
    delta: number
  ): void {
    this.heavyAttackProgress += delta;

    const t = Math.min(
      this.heavyAttackProgress /
      this.HEAVY_ATTACK_DURATION,
      1
    );

    const eased =
      this.heavySwingEase(t);

    /*
     * Follow the latest networked aim angle throughout
     * the heavy swing, like the local sword follows
     * the mouse angle.
     */
    if (Number.isFinite(this.aimAngle)) {
      this.heavyAttackAimAngle =
        this.aimAngle;
    }

    const dynamicStartAngle =
      this.heavyAttackAimAngle +
      this.swingStartOffset;

    const dynamicEndAngle =
      this.heavyAttackAimAngle +
      this.swingEndOffset;

    this.orbitAngle =
      dynamicStartAngle +
      (
        dynamicEndAngle -
        dynamicStartAngle
      ) *
      eased;

    const rotatedOffset =
      this.offset
        .clone()
        .rotate(this.orbitAngle)
        .add(ex.vec(0, 5));

    this.pos =
      this.player.pos
        .clone()
        .add(rotatedOffset)
        .add(
          ex.vec(
            0,
            this.player.bobOffsetY ?? 0
          )
        );

    this.rotation =
      this.orbitAngle +
      this.ROT_OFFSET;

    this.updateShadow();

    /*
     * Spawn at the current networked aim angle when
     * the release point is reached.
     */
    if (
      !this.heavySlashSpawned &&
      this.heavyAttackProgress >=
      this.HEAVY_ATTACK_RELEASE_TIME
    ) {
      this.heavySlashSpawned = true;

      this.spawnHeavySlash();
    }

    if (t >= 1) {
      this.heavyAttacking = false;
      this.heavyAttackProgress = 0;

      this.idleOrbitAngleOffset =
        this.swingEndOffset;

      this.smoothedAimAngle =
        this.heavyAttackAimAngle;

      this.orbitAngle =
        dynamicEndAngle;

      this.playPendingAttack();
    }
  }

  private spawnHeavySlash(): void {
    const direction =
      ex.Vector.fromAngle(
        this.heavyAttackAimAngle
      );

    const spawnPos =
      this.player.pos
        .clone()
        .add(direction.scale(85))
        .add(
          ex.vec(
            0,
            this.player.bobOffsetY ?? 0
          )
        );

    const slash =
      new HeavySlashProjectile({
        pos: spawnPos,

        angle:
          this.heavyAttackAimAngle,

        speed:
          this.HEAVY_SLASH_SPEED,

        maxDistance:
          this.HEAVY_SLASH_DISTANCE,

        // Remote projectile is visual-only.
        onEnemyHit: () => { },
      });

    this.engine.currentScene.add(
      slash
    );

    console.log(
      "Remote heavy projectile added:",
      {
        scene:
          this.engine.currentScene,

        position:
          slash.pos.toString(),

        angle:
          this.heavyAttackAimAngle,
      }
    );
  }

  private heavySwingEase(t: number) {
    if (!Number.isFinite(t)) return 0;

    t = Math.max(0, Math.min(t, 1));

    const startPortion = 0.35;
    const middlePortion = 0.3;
    const endPortion = 0.35;

    const startDistance = 0.08;
    const middleDistance = 0.84;
    const endDistance = 0.08;

    const startPower = 2.8;
    const endPower = 2.8;

    const middleStart = startPortion;
    const endStart = startPortion + middlePortion;

    if (t < middleStart) {
      const p = t / startPortion;
      return startDistance * Math.pow(p, startPower);
    }

    if (t < endStart) {
      const p = (t - middleStart) / middlePortion;
      return startDistance + middleDistance * p;
    }

    const p = (t - endStart) / endPortion;
    const easedOut = 1 - Math.pow(1 - p, endPower);

    return startDistance + middleDistance + endDistance * easedOut;
  }

  private lerpAngle(current: number, target: number, t: number) {
    let diff = target - current;

    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return current + diff * t;
  }

  private updateShadow() {
    if (!this.shadow) return;

    this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
  }

  cleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;

    this.shadow?.kill();
    this.swingTracer?.kill();
    this.thrustTracer?.kill();
  }

  onPreKill() {
    this.cleanup();
  }
}
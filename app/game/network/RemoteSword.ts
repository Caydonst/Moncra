import * as ex from "excalibur";
import { GameResources } from "../resources";
import { Shadow } from "../utils/shadow";
import { SwingTracer, ThrustTracer } from "../weapons/sword";

type AttackType = "slash" | "thrust";

type Attack = {
  type: AttackType;
  duration: number;
  cooldown: number;
  damageMultiplier: number;
  startOffset?: number;
  endOffset?: number;
  thrustDistance?: number;
};

export class RemoteSword extends ex.Actor {
  private shadow!: Shadow;
  private swingTracer!: SwingTracer;
  private thrustTracer!: ThrustTracer;

  private offset: ex.Vector;

  private swinging = false;
  private thrusting = false;

  private swingProgress = 0;
  private swingDuration = 250;

  private swingStartAngle = 0;
  private swingEndAngle = 0;
  private orbitAngle = 0;
  private idleOrbitAngleOffset = Math.PI / 1.5;

    private comboThreshold = 400;
    private lastSwingTime = 0;

  private thrustDirection = ex.vec(0, 0);
  private thrustDistance = 15;
  private thrustPauseTime = 150;

  private aimAngle = 0;
  private smoothedAimAngle = 0;

  private comboIndex = 0;
  private currentAttack!: Attack;

  private readonly ROT_OFFSET = Math.PI * 0.75;

  private combo: Attack[] = [
    {
      type: "slash",
      duration: 250,
      cooldown: 350,
      damageMultiplier: 1,
      startOffset: Math.PI / 1.5,
      endOffset: -Math.PI / 1.5,
    },
    {
      type: "slash",
      duration: 250,
      cooldown: 350,
      damageMultiplier: 1,
      startOffset: -Math.PI / 1.5,
      endOffset: Math.PI / 1.5,
    },
    {
      type: "slash",
      duration: 250,
      cooldown: 350,
      damageMultiplier: 1.2,
      startOffset: -Math.PI / 1.5,
      endOffset: Math.PI / 1.5,
    },
    {
      type: "thrust",
      duration: 220,
      cooldown: 350,
      damageMultiplier: 1.5,
      thrustDistance: 15,
    },
  ];

  constructor(
    private player: ex.Actor & { bobOffsetY?: number },
    private resources: GameResources,
    private image: ex.ImageSource
  ) {
    super({
      name: "remote-sword",
      pos: player.pos.clone(),
      anchor: ex.vec(0.75, 0.75),
      width: image.width * 3.5,
      height: image.height * 3.5,
      z: 4,
      collisionType: ex.CollisionType.PreventCollision,
    });

    this.offset = ex.vec(this.height * 0.35, 0);
  }

  onInitialize(engine: ex.Engine) {
    const sprite = this.image.toSprite();
    sprite.width = this.width;
    sprite.height = this.height;

    this.graphics.use(sprite);

    this.shadow = new Shadow(this);
    engine.currentScene.add(this.shadow);

    this.swingTracer = new SwingTracer();
    engine.currentScene.add(this.swingTracer);

    this.thrustTracer = new ThrustTracer();
    engine.currentScene.add(this.thrustTracer);
  }

  setAimAngle(aimAngle: number) {
    this.aimAngle = aimAngle;
  }

  private lerpAngle(current: number, target: number, t: number) {
    let diff = target - current;

    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return current + diff * t;
  }

    playAttack() {
        if (this.swinging || this.thrusting) return;

        const now = performance.now();

        if (now - this.lastSwingTime > this.comboThreshold) {
        this.comboIndex = 0;
        }

        this.lastSwingTime = now;

        this.currentAttack = this.combo[this.comboIndex];

        this.swingDuration = this.currentAttack.duration;
        this.swingProgress = 0;

        if (this.currentAttack.type === "slash") {
        this.startSlash(this.aimAngle);

        this.swingTracer.start(
            this.player,
            this.swingStartAngle,
            this.swingEndAngle,
            this.swingDuration,
            this.height
        );
        } else {
        this.startThrust(this.aimAngle);
        }

        this.comboIndex = (this.comboIndex + 1) % this.combo.length;
    }

  private startSlash(aimAngle: number) {
    this.swinging = true;
    this.swingProgress = 0;

    this.swingStartAngle = aimAngle + this.currentAttack.startOffset!;
    this.swingEndAngle = aimAngle + this.currentAttack.endOffset!;

    this.idleOrbitAngleOffset = this.currentAttack.endOffset!;
    this.orbitAngle = this.swingStartAngle;
  }

  private startThrust(aimAngle: number) {
    this.thrusting = true;
    this.swingProgress = 0;

    this.thrustDirection = ex.Vector.fromAngle(aimAngle);
    this.thrustDistance = this.currentAttack.thrustDistance ?? 55;

    const base = this.player.pos.clone().add(
      this.thrustDirection.scale(this.height * 0.35)
    );

    const tipStart = base.add(
      this.thrustDirection.scale(this.height * 0.45)
    );

    const tipEnd = tipStart.add(
      this.thrustDirection.scale(this.thrustDistance + 35)
    );

    this.thrustTracer.startTrace(tipStart, tipEnd, 140);
  }

  onPostUpdate(engine: ex.Engine, delta: number) {
    this.swingTracer?.updateTracer(engine, delta);
    this.thrustTracer?.updateTracer(engine, delta);

    const t = Math.min(1, delta / 50);

    this.smoothedAimAngle = this.lerpAngle(
      this.smoothedAimAngle,
      this.aimAngle,
      t
    );

    const bobOffsetY = this.player.bobOffsetY ?? 0;

    if (this.thrusting) {
      this.updateThrust(delta, bobOffsetY);
      return;
    }

    if (this.swinging) {
      this.updateSwing(delta, bobOffsetY);
      return;
    }

    this.updateIdle(bobOffsetY);
  }

  private updateSwing(delta: number, bobOffsetY: number) {
    this.swingProgress += delta;

    const t = Math.min(this.swingProgress / this.swingDuration, 1);
    const eased = t * t * (3 - 2 * t);

    this.orbitAngle =
      this.swingStartAngle +
      (this.swingEndAngle - this.swingStartAngle) * eased;

    const rotatedOffset = this.offset
      .rotate(this.orbitAngle)
      .add(ex.vec(0, 5));

    this.pos = this.player.pos
      .clone()
      .add(rotatedOffset)
      .add(ex.vec(0, bobOffsetY));

    this.rotation = this.orbitAngle + this.ROT_OFFSET;

    this.updateShadow();

    if (t >= 1) {
      this.swinging = false;
      this.orbitAngle = this.swingEndAngle;
    }
  }

  private updateIdle(bobOffsetY: number) {
    this.orbitAngle = this.smoothedAimAngle + this.idleOrbitAngleOffset;

    const rotatedOffset = this.offset
      .rotate(this.orbitAngle)
      .add(ex.vec(0, 5));

    this.pos = this.player.pos
      .clone()
      .add(rotatedOffset)
      .add(ex.vec(0, bobOffsetY));

    this.rotation = this.orbitAngle + this.ROT_OFFSET;

    this.updateShadow();
  }

  private updateThrust(delta: number, bobOffsetY: number) {
    this.swingProgress += delta;

    const forwardTime = 45;
    const pauseTime = this.thrustPauseTime;
    const retractTime = 100;
    const total = forwardTime + pauseTime + retractTime;

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

    const baseOffset = this.thrustDirection.scale(this.height * 0.35);
    const thrustOffset = this.thrustDirection.scale(this.thrustDistance * thrustT);

    this.pos = this.player.pos
      .clone()
      .add(baseOffset)
      .add(thrustOffset)
      .add(ex.vec(0, bobOffsetY));

    this.rotation = this.thrustDirection.toAngle() + this.ROT_OFFSET;

    this.updateShadow();

    if (this.swingProgress >= total) {
      this.thrusting = false;
      this.swingProgress = 0;
    }
  }

  private updateShadow() {
    if (this.shadow) {
      this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2.5));
    }
  }

  cleanup() {
    this.shadow?.kill();
    this.swingTracer?.kill();
    this.thrustTracer?.kill();
    this.kill();
  }
}
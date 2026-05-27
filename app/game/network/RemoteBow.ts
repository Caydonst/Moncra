import * as ex from "excalibur";
import { GameResources } from "../resources";
import { Shadow } from "../utils/shadow";

export class RemoteBow extends ex.Actor {
  private shadow!: Shadow;

  private bowIdleSprite!: ex.Sprite;
  private bowDrawAnim!: ex.Animation;

  private isDrawing = false;
  private lastAttackState = false;
  private animationDuration = 120;
  private lastAttackId = -1;

  private aimAngle = 0;

  private readonly ROT_OFFSET = Math.PI / 4;

  constructor(
    private player: ex.Actor & { bobOffsetY?: number },
    private resources: GameResources
  ) {
    super({
      pos: player.pos.clone(),
      anchor: ex.vec(0.5, 0.5),
      width: resources.Images.bow.width * 2.5,
      height: resources.Images.bow.height * 2.5,
      collisionType: ex.CollisionType.PreventCollision,
      z: 4,
    });
  }

  onInitialize(engine: ex.Engine) {
    this.bowIdleSprite = this.resources.Images.bow.toSprite();
    this.bowIdleSprite.width = this.width;
    this.bowIdleSprite.height = this.height;

    const bowFrames = this.resources.bowSpritesheet.sprites.map(sprite => {
      const s = sprite.clone();
      s.scale = ex.vec(2.5, 2.5);

      return {
        graphic: s,
        duration: this.animationDuration,
      };
    });

    this.bowDrawAnim = new ex.Animation({
      frames: bowFrames,
    });

    this.graphics.use(this.bowIdleSprite);

    this.shadow = new Shadow(this);
    engine.currentScene.add(this.shadow);
  }

    updateFromNetwork(data: {
        aimAngle: number;
        isAttacking: boolean;
        attackId: number;
    }) {
        this.aimAngle = data.aimAngle;

        if (data.attackId !== this.lastAttackId) {
            this.lastAttackId = data.attackId;
            this.playDrawAnimation();
        }

        this.lastAttackState = data.isAttacking;
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        const bobOffsetY = this.player.bobOffsetY ?? 0;

        const direction = ex.Vector.fromAngle(this.aimAngle);
        const distance = 12;

        const offsetVec = direction
            .normalize()
            .scale(distance)
            .add(ex.vec(0, 5));

        const bobbedOffset = offsetVec.add(ex.vec(0, bobOffsetY));

        this.pos = this.player.pos.clone().add(bobbedOffset);
        const t = Math.min(1, delta / 50);

        this.rotation = this.lerpAngle(
            this.rotation,
            this.aimAngle + this.ROT_OFFSET,
            t
        );

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2 + 15));
        }
    }

    public playDrawAnimation(onRelease?: () => void) {
        if (!this.bowDrawAnim || !this.bowIdleSprite) return;
        if (this.isDrawing) return;

        this.isDrawing = true;

        this.bowDrawAnim.reset();
        this.graphics.use(this.bowDrawAnim);

        const duration = 4 * this.animationDuration;

        setTimeout(() => {
            onRelease?.();

            if (!this.isKilled()) {
            this.graphics.use(this.bowIdleSprite);
            }

            this.isDrawing = false;
        }, duration);
    }

    public spawnRemoteArrow(data: any) {
      const direction = ex.Vector.fromAngle(data.aimAngle);

      const scene = this.scene as ex.Scene;

      scene.projectileManager.spawn(
        ex.vec(data.x, data.y),
        direction.scale(1000),
        0
      );
    }

    public setAimAngle(aimAngle: number) {
        this.aimAngle = aimAngle;
    }

    lerpAngle(current: number, target: number, t: number) {
        let diff = target - current;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return current + diff * t;
    }

  cleanup() {
    this.shadow?.kill();
    this.kill();
  }
}
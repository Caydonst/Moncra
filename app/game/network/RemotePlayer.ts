import * as ex from "excalibur";
import { GameResources } from "@/app/game/resources";
import { Shadow } from "../utils/shadow";
import { GameScene } from "../scenes/GameScene";
import { RemoteBow } from "./RemoteBow";
import { RemoteSword } from "./RemoteSword";

export class RemotePlayer extends ex.Actor {
    private walkAnim!: ex.Animation;
    private idleAnim!: ex.Animation;

    private shadow!: Shadow;
    private particleTimer!: ex.Timer;

    private lastPos = ex.vec(0, 0);
    private moving = false;

    private lastNetworkPos = ex.vec(0, 0);
    private lastMoveTime = 0;

    private targetPos = ex.vec(0, 0);

    private weaponActor: ex.Actor | null = null;
    private currentWeaponId = "";

    public bobOffsetY = 0;

    private aimAngle = 0

  constructor(
    pos: ex.Vector,
    private resources: GameResources
  ) {
    super({
      name: "remote-player",
      pos,
      anchor: ex.vec(0.5, 0.5),
      width: 15 * 2,
      height: 20 * 2,
      z: 3,
      collisionType: ex.CollisionType.PreventCollision,
    });

    this.lastPos = pos.clone();
    this.targetPos = pos.clone();
  }

  onInitialize(engine: ex.Engine) {
    const walkFrames = this.resources.characterWalkSpritesheet.sprites.map(sprite => {
      const s = sprite.clone();
      s.scale = ex.vec(2, 2);
      return { graphic: s, duration: 120 };
    });

    const idleFrames = this.resources.characterIdleSpritesheet.sprites.map(sprite => {
      const s = sprite.clone();
      s.scale = ex.vec(2, 2);
      return { graphic: s, duration: 180 };
    });

    this.walkAnim = new ex.Animation({ frames: walkFrames });
    this.idleAnim = new ex.Animation({ frames: idleFrames });

    this.graphics.add("idle", this.idleAnim);
    this.graphics.add("walk", this.walkAnim);
    this.graphics.use("idle");

    this.shadow = new Shadow(this);
    engine.currentScene.add(this.shadow);

    const random = new ex.Random();

    this.particleTimer = new ex.Timer({
      interval: 0,
      random,
      randomRange: [50, 200],
      repeats: true,
      action: () => {
        if (!this.moving) return;

        const scene = this.scene as GameScene;

        scene.dustParticleManager?.spawnDust(
          this.pos.add(ex.vec(0, 18)),
          1
        );
      },
    });

    engine.currentScene.add(this.particleTimer);
    this.particleTimer.start();
  }

    private getWeaponIcon(weaponId: string): ex.ImageSource {
        const swordImages: Record<string, ex.ImageSource> = {
            great_sword0: this.resources.Images.greatSword0,
            great_sword1: this.resources.Images.greatSword,
            great_sword2: this.resources.Images.greatSword2,
            obsidian_sword: this.resources.Images.greatSword1,
        };

        return swordImages[weaponId] ?? this.resources.Images.greatSword0;
    }

    

    private clearWeapon() {
        this.weaponActor?.kill();
        this.weaponActor = null;
        this.currentWeaponId = "";
    }

    updateWeapon(weapon: any, engine: ex.Engine) {
        if (!weapon || !weapon.id) {
            this.clearWeapon();
            return;
        }

        if (weapon.id === this.currentWeaponId) return;

        this.clearWeapon();

        this.currentWeaponId = weapon.id;

        const icon = this.getWeaponIcon(weapon.id);

        this.weaponActor = new RemoteSword(
            this,
            this.resources,
            icon,
        );

        engine.currentScene.add(this.weaponActor);
    }

    updateFromNetwork(player: any, engine: ex.Engine) {
        console.log(player)
        this.targetPos = ex.vec(player.x, player.y);
        this.rotation = player.rotation;

        this.aimAngle = player.aimAngle ?? this.aimAngle;

        const aimingLeft = Math.cos(this.aimAngle) > 0;

        if (this.idleAnim && this.walkAnim) {
            this.idleAnim.flipHorizontal = aimingLeft;
            this.walkAnim.flipHorizontal = aimingLeft;
        }

        this.updateWeapon(player.weapon, engine);

        if (this.weaponActor instanceof RemoteBow) {
            this.weaponActor.setAimAngle(player.aimAngle ?? 0);
        }
        if (this.weaponActor instanceof RemoteSword) {
            this.weaponActor.setAimAngle(player.aimAngle ?? 0);
        }

        const movedDistance = this.targetPos.distance(this.pos);

        if (movedDistance > 0.1) {
            this.lastMoveTime = performance.now();
        }
    }

    playWeaponAttack(data: any) {
        if (this.weaponActor instanceof RemoteBow) {
            this.weaponActor.setAimAngle(data.aimAngle ?? 0);

            this.weaponActor.playDrawAnimation(() => {
            this.spawnRemoteArrow(data);
            });
        }
        if (this.weaponActor instanceof RemoteSword) {
            this.weaponActor.setAimAngle(data.aimAngle ?? 0);
            this.weaponActor.playAttack();
        }
    }

    playWeaponAttackStart(data: any) {
        if (this.weaponActor instanceof RemoteBow) {
            this.weaponActor.setAimAngle(data.aimAngle ?? 0);
            this.weaponActor.playDrawAnimation();
        }

        if (this.weaponActor instanceof RemoteSword) {
            this.weaponActor.setAimAngle(data.aimAngle ?? 0);
            this.weaponActor.playAttack();
        }
    }

    playWeaponAttackRelease(data: any) {
        if (this.weaponActor instanceof RemoteBow) {
            this.weaponActor.setAimAngle(data.aimAngle ?? 0);
            this.weaponActor.spawnRemoteArrow(data);
        }
    }

    private spawnRemoteArrow(data: any) {
        const direction = ex.Vector.fromAngle(data.aimAngle);

        const spawnDistance = 30;

        const spawnPos = this.pos.add(
            direction.scale(spawnDistance)
        );

        const speed = 1000;

        this.scene?.projectileManager.spawnRemoteProjectile(
            spawnPos,
            direction.scale(speed)
        );
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        const t = Math.min(1, delta / 50);

        this.pos = this.pos.lerp(this.targetPos, t);

        const recentlyMoved = performance.now() - this.lastMoveTime < 150;

        this.moving = recentlyMoved;

        this.graphics.use(this.moving ? "walk" : "idle");

        const bobWalk = [0, -4, -2, 0, -4];
        const bobIdle = [0, 2, 4, 2];

        if (this.moving) {
            const frame = this.walkAnim.currentFrameIndex;
            this.bobOffsetY = bobWalk[frame] ?? 0;
        } else {
            const frame = this.idleAnim.currentFrameIndex;
            this.bobOffsetY = bobIdle[frame] ?? 0;
        }

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, (this.height / 2) - 3));
        }
    }

    onPreKill() {
        this.weaponActor?.kill();
        this.weaponActor = null;

        this.shadow?.kill();
        this.particleTimer?.cancel();
    }
}
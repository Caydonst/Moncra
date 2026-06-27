import { GameResources } from "@/app/game/resources";

const ex = await import("excalibur");

import { Shadow } from "../utils/shadow";
import { HPBar } from "../utils/hpbar";

type ServerEnemyState = {
    id: string;
    type: "demon";

    x: number;
    y: number;
    vx: number;
    vy: number;

    hp: number;
    maxHp: number;

    isDead: boolean;
    isAggro: boolean;

    state?: "idle" | "walk" | "hurt" | "dead";
};

export class Demon extends ex.Actor {
    public enemyId: string;

    private walkAnim!: ex.Animation;
    private deadAnim!: ex.Animation;
    private miscAnim!: ex.Animation;
    private hurtSprite!: ex.Sprite;

    private shadow!: Shadow;
    private hpBar!: HPBar;

    private displayedHp = 0;
    private playedDeath = false;
    private playedMisc = false;

    private targetPos = ex.vec(0, 0);
    private lastServerState: ServerEnemyState | null = null;

    constructor(
        enemyState: ServerEnemyState,
        private resources: GameResources,
        //private collisionGroups: any,
    ) {
        super({
            name: "enemy",
            pos: ex.vec(enemyState.x, enemyState.y),
            anchor: ex.vec(0.5, 0.5),
            width: 14 * 2.5,
            height: 21 * 2.5,
            color: ex.Color.Red,
            z: 2,
            collisionType: ex.CollisionType.Passive,
            //collisionGroup: collisionGroups.enemyGroup,
        });

        this.enemyId = enemyState.id;
        this.targetPos = ex.vec(enemyState.x, enemyState.y);
        this.displayedHp = enemyState.hp;

        this.tags.add("enemy");
    }

    onInitialize(engine: ex.Engine) {
        const walkFrames = Object.keys(this.resources.DemonImages.walk).map(key => {
            const sprite = this.resources.DemonImages.walk[key].toSprite();
            sprite.scale = ex.vec(2.5, 2.5);

            return {
                graphic: sprite,
                duration: 150,
            };
        });
        
        const deadFrames = Object.keys(this.resources.DemonImages.dead).map(key => {
            const sprite = this.resources.DemonImages.dead[key].toSprite();
            sprite.scale = ex.vec(2.5, 2.5);

            return {
                graphic: sprite,
                duration: 300,
                loop: false,
            };
        });

        const miscFrames = Object.keys(this.resources.MiscImages).map(key => {
            const sprite = this.resources.MiscImages[key].toSprite();
            sprite.scale = ex.vec(2, 2);
            sprite.origin = ex.vec(0.5, 1);

            return {
                graphic: sprite,
                duration: 80,
                loop: false,
            };
        });

        this.walkAnim = new ex.Animation({
            frames: walkFrames,
        });

        this.deadAnim = new ex.Animation({
            frames: deadFrames,
            strategy: ex.AnimationStrategy.End,
        });

        this.miscAnim = new ex.Animation({
            frames: miscFrames,
            strategy: ex.AnimationStrategy.End,
        });

        this.graphics.add("walk", this.walkAnim);
        this.graphics.add("dead", this.deadAnim);
        this.graphics.add("misc", this.miscAnim);
        this.graphics.use("walk");

        this.hurtSprite = this.resources.DemonImages.hurt.demonHurt.toSprite();
        this.hurtSprite.width *= 2.5;
        this.hurtSprite.height *= 2.5;

        this.hpBar = new HPBar(this, this.width, 5, this.displayedHp, "enemy");
        engine.currentScene.add(this.hpBar);

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        if (!this.lastServerState) return;

        const state = this.lastServerState;

        this.pos = this.pos.lerp(this.targetPos, 0.25);

        this.updateHpBar(state);
        this.updateFacing(state);
        this.updateAnimation(state);

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2));
        }

        if (state.isDead && this.playedMisc && this.miscAnim.done) {
            this.destroyEnemy();
        }
    }

    public updateFromServer(state: ServerEnemyState) {
        this.lastServerState = state;
        this.targetPos = ex.vec(state.x, state.y);
    }

    public playHitFlash() {
        if (this.lastServerState?.isDead) return;

        if (this.lastServerState?.vx && this.lastServerState.vx > 0) {
            this.hurtSprite.flipHorizontal = true;
        }

        this.graphics.use(this.hurtSprite);

        this.scene?.engine.currentScene.add(
            new ex.Timer({
                interval: 150,
                repeats: false,
                action: () => {
                    if (!this.lastServerState?.isDead) {
                        this.graphics.use("walk");
                    }
                },
            })
        );
    }

    private updateHpBar(state: ServerEnemyState) {
        if (this.displayedHp === state.hp) return;

        this.displayedHp = state.hp;
        this.hpBar?.setHP(state.hp);
    }

    private updateFacing(state: ServerEnemyState) {
        const flip = state.vx > 0;

        this.walkAnim.flipHorizontal = flip;
        this.deadAnim.flipHorizontal = flip;
        this.miscAnim.flipHorizontal = flip;
    }

    private updateAnimation(state: ServerEnemyState) {
        if (state.isDead) {
            if (!this.playedDeath) {
                this.deadAnim.reset();
                this.miscAnim.reset();

                this.graphics.use("dead");
                this.playedDeath = true;

                this.hpBar?.kill();
                return;
            }

            if (!this.playedMisc && this.deadAnim.done) {
                this.miscAnim.reset();

                this.graphics.offset = ex.vec(0, -30);
                this.graphics.use("misc");
                this.playedMisc = true;
                return;
            }

            return;
        }

        if (state.state === "hurt") {
            this.graphics.use(this.hurtSprite);
            return;
        }

        this.graphics.use("walk");
    }

    public destroyEnemy() {
        this.hpBar?.kill();
        this.shadow?.kill();
        this.kill();
    }
}
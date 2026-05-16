import * as ex from "excalibur";
import { Demon } from "../enemies/demon";
import { DemonBoss } from "../enemies/bosses/DemonBoss";
import { GameResources } from "../resources";
import { EnemyPlayer } from "../enemies/enemyPlayer";

type Projectile = {
    pos: ex.Vector;
    previousPos: ex.Vector;
    vel: ex.Vector;
    rotation: number;
    damage: number;
    spawnTime: number;
    alive: boolean;
};

export class ProjectileManager extends ex.Actor {
    private projectiles: Projectile[] = [];

    private readonly maxTrailLength = 90;
    private readonly trailGrowTimeMs = 80;
    private readonly trailWidth = 6;
    private arrowSprite!: ex.Sprite;
    private trailGraphic!: ex.Polygon;
    private projectileCollider = new ex.CircleCollider({
        radius: 3,
    });

    constructor(
        private resources: GameResources,
        private collisionGroups: any
    ) {
        super({
            name: "projectile-manager",
            pos: ex.vec(0, 0),
            z: 2,
            collisionType: ex.CollisionType.PreventCollision,
        });
    }

    onInitialize() {
        this.arrowSprite = this.resources.Images.arrow.toSprite();
        this.arrowSprite.scale = ex.vec(1, 1);

        this.graphics.onPostDraw = (ctx) => {
            for (const projectile of this.projectiles) {
                if (!projectile.alive) continue;

                this.drawProjectile(ctx, projectile);
            }
        };
    }

    public spawn(pos: ex.Vector, vel: ex.Vector, damage: number) {
        this.projectiles.push({
            pos: pos.clone(),
            previousPos: pos.clone(),
            vel: vel.clone(),
            rotation: vel.toAngle() + Math.PI / 2,
            damage,
            spawnTime: performance.now(),
            alive: true,
        });
    }

    onPostUpdate(engine: ex.Engine, delta: number) {
        const dt = delta / 1000;

        // Keep manager near the camera so Excalibur keeps drawing it
        this.pos = engine.currentScene.camera.pos.clone();

        for (const projectile of this.projectiles) {
            if (!projectile.alive) continue;

            projectile.previousPos = projectile.pos.clone();
            projectile.pos = projectile.pos.add(projectile.vel.scale(dt));

            this.checkSweptCollision(engine, projectile);

            if (projectile.alive) {
                this.checkTilemapCollision(engine, projectile);
            }
        }

        this.projectiles = this.projectiles.filter(projectile => projectile.alive);
    }

    private drawProjectile(
        ctx: ex.ExcaliburGraphicsContext,
        projectile: Projectile
    ) {
        ctx.save();

        const localPos = projectile.pos.sub(this.pos);

        ctx.translate(localPos.x, localPos.y);
        ctx.rotate(projectile.rotation);

        // Center arrow image on projectile.pos
        this.arrowSprite.draw(
            ctx,
            -this.resources.Images.arrow.width / 2,
            -this.resources.Images.arrow.height / 2
        );

        ctx.restore();
    }

    private checkSweptCollision(engine: ex.Engine, projectile: Projectile) {
        const enemies = engine.currentScene.actors.filter(actor =>
            actor instanceof Demon ||
             actor instanceof DemonBoss ||
             actor instanceof EnemyPlayer
        );

        // Enemy collision
        for (const enemy of enemies) {
            if (
                this.segmentIntersectsActor(
                    projectile.previousPos,
                    projectile.pos,
                    enemy
                )
            ) {
                enemy.takeDamage(projectile.damage);
                engine.currentScene.camera.shake(4, 4, 60);

                projectile.alive = false;
                return;
            }
        }

        //this.checkTilemapCollision(engine, projectile);

        // Wall collision
        //this.checkWallCollision(engine, projectile);
    }

    private segmentIntersectsActor(start: ex.Vector, end: ex.Vector, actor: ex.Actor) {
        const minX = actor.pos.x - actor.width * actor.anchor.x;
        const maxX = minX + actor.width;

        const minY = actor.pos.y - actor.height * actor.anchor.y;
        const maxY = minY + actor.height;

        return this.segmentIntersectsRect(start, end, minX, minY, maxX, maxY);
    }

    private segmentIntersectsRect(
        start: ex.Vector,
        end: ex.Vector,
        minX: number,
        minY: number,
        maxX: number,
        maxY: number
    ) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        let tMin = 0;
        let tMax = 1;

        const checkAxis = (
            startValue: number,
            direction: number,
            min: number,
            max: number
        ) => {
            if (Math.abs(direction) < 0.00001) {
                return startValue >= min && startValue <= max;
            }

            let t1 = (min - startValue) / direction;
            let t2 = (max - startValue) / direction;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            return tMin <= tMax;
        };

        return (
            checkAxis(start.x, dx, minX, maxX) &&
            checkAxis(start.y, dy, minY, maxY)
        );
    }
    private checkTilemapCollision(engine: ex.Engine, projectile: Projectile) {
        const movement = projectile.pos.sub(projectile.previousPos);
        if (movement.magnitude <= 0) return;

        const hits = engine.currentScene.physics.rayCast(
            new ex.Ray(projectile.previousPos, movement.normalize()),
            {
                maxDistance: movement.magnitude,
                searchAllColliders: false,
            }
        );

        for (const hit of hits) {
            const owner = hit.collider.owner;

            // Ignore normal actors
            if (owner instanceof ex.Actor) {
                continue;
            }

            // If the collider has no Actor owner, it is likely from the TileMap/Tiled solid layer
            projectile.alive = false;
            return;
        }
    }
}
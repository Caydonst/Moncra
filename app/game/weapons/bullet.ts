const ex = await import("excalibur");
import { Demon } from '../enemies/demon'
import {GameResources} from '../resources'
import {collidesWithWall8} from '../utils/checkCollisions'
import {spawnParticles, wallParticles} from "../utils/ParticleHelper";
import {Shadow} from "../utils/shadow";
import {Player} from "../player/player";
import {DemonBoss} from "../enemies/bosses/DemonBoss";
import { GameScene } from '../scenes/GameScene';


export class Bullet extends ex.Actor {
    private shadow: Shadow;
    private previousPos: ex.Vector;
    private hasHit = false;
    private bulletSprite!: ex.Sprite;
    private trailStartTime = performance.now();

    private maxTrailLength = 90;
    private trailGrowTimeMs = 80;
    private trailWidth = 2;

    constructor(
        private engine: ex.Engine,
        offsetDistance: number,
        pos: ex.Vector,
        vel: ex.Vector,
        private resources: GameResources,
        private collisionGroups: any,
        private damage: number
    ) {

        super({
            name: "projectile",
            pos: pos,
            anchor: ex.vec(0.5, 0.5),
            height: resources.Images.bullet.height * 1.5,
            width: resources.Images.bullet.width * 0.5,
            collisionType: ex.CollisionType.Passive,
            collisionGroup: collisionGroups.projectileGroup,
            z: 2
        });

        this.vel = vel;
        this.previousPos = this.pos.clone();
    }

    onInitialize(engine: ex.Engine): void {
        const bulletSprite = this.resources.Images.bullet.toSprite();
        bulletSprite.scale = ex.vec(0.5, 1);
        //bulletSprite.width = this.width;
        //bulletSprite.height = this.height;

        this.graphics.use(bulletSprite);
        this.rotation = this.vel.toAngle() + Math.PI / 2;

        const start = this.previousPos;
        const end = this.pos;
        const movement = end.sub(start);

        //this.shadow = new Shadow(this);
        //engine.currentScene.add(this.shadow);

        this.trailStartTime = performance.now();

        this.updateBulletGraphic();
        this.rotation = this.vel.toAngle() + Math.PI / 2;
    }

    onPostUpdate(engine: ex.Engine, _delta: number) {
        if (this.hasHit) return;

        this.checkSweptCollision(engine);

        if (this.hasHit) return;

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height / 2 - 2));
        }

        this.updateBulletGraphic();
        
        /*
        const now = performance.now();

        if (now - this.lastTrailTime >= this.trailInterval) {
            this.lastTrailTime = now;

            engine.currentScene.particleManager.emit(
                this.pos.clone(),
                1,
                ex.Color.fromHex("#ffd000"),
                0,
                0,
                300,
                2,
                2,
                5,
            )
        }
        */

         


        this.previousPos = this.pos.clone();
    }
    private updateBulletGraphic() {
        const elapsed = performance.now() - this.trailStartTime;
        const growPercent = Math.min(elapsed / this.trailGrowTimeMs, 1);
        const currentLength = this.maxTrailLength * growPercent;

        const bulletBackOffset = this.height / 2;

        const trail = new ex.Polygon({
            points: [
                ex.vec(0, this.trailWidth / 2),
                ex.vec(this.trailWidth / 2, bulletBackOffset),
                ex.vec(-this.trailWidth / 2, bulletBackOffset),
            ],
            color: ex.Color.fromRGB(255, 170, 0, 0.6),
        });

        trail.points = [
            ex.vec(0, bulletBackOffset + currentLength),
            ex.vec(-this.trailWidth / 2, bulletBackOffset),
            ex.vec(this.trailWidth / 2, bulletBackOffset),
        ];

        const group = new ex.GraphicsGroup({
            useAnchor: false,
            members: [
                {
                    graphic: trail,
                    offset: ex.vec(0, 0),
                },
                {
                    graphic: this.bulletSprite,
                    offset: ex.vec(0, 0),
                },
            ],
        });

        this.graphics.use(group);
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

        const checkAxis = (startValue: number, direction: number, min: number, max: number) => {
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

    private segmentIntersectsActor(start: ex.Vector, end: ex.Vector, actor: ex.Actor) {
        const minX = actor.pos.x - actor.width / 2;
        const maxX = actor.pos.x + actor.width / 2;
        const minY = actor.pos.y - actor.height / 2;
        const maxY = actor.pos.y + actor.height / 2;

        return this.segmentIntersectsRect(start, end, minX, minY, maxX, maxY);
    }

    private checkSweptCollision(engine: ex.Engine) {
        if (this.hasHit) return;

        const start = this.previousPos;
        const end = this.pos;
        const movement = end.sub(start);

        if (movement.size <= 0) return;

        const enemies = engine.currentScene.actors.filter(actor =>
            actor instanceof Demon || actor instanceof DemonBoss
        );

        const walls = engine.currentScene.actors.filter(actor =>
            actor.tags.has("wall")
        );

        for (const enemy of enemies) {
            if (this.segmentIntersectsActor(start, end, enemy)) {

                enemy.takeDamage(this.damage);
                engine.currentScene.camera.shake(4, 4, 60);
                //spawnParticles(engine.currentScene, enemy.pos, "enemy");

                this.destroyBullet();
                return;
            }
        }

        for (const wall of walls) {
            if (this.segmentIntersectsActor(start, end, wall)) {
                /*
                (engine.currentScene as GameScene).particleManager.emit(
                    wall.pos,
                    12,
                    ex.Color.fromHex("#919191"),
                    10,
                    20,
                    300,
                    3,
                    0,
                    5,
                );
                */

                this.destroyBullet();
                return;
            }
        }
    }

    onCollisionStart(_self: ex.Collider, other: ex.Collider) {
        if (this.hasHit) return;

        const owner = other.owner;

        if (owner instanceof Demon || owner instanceof DemonBoss) {
            return;
            //owner.takeDamage(this.damage);
            //spawnParticles(engine.currentScene, enemy.pos, "enemy");

        }

        this.destroyBullet();
    }

    private destroyBullet() {
        if (this.hasHit) return;

        this.hasHit = true;
        this.vel = ex.Vector.Zero;

        this.shadow?.kill();
        this.kill();
        console.log("Bullet killed")
    }
}
const ex = await import("excalibur");
import { Demon } from '../enemies/demon'
import {GameResources} from '../resources'
import {collidesWithWall8} from '../utils/checkCollisions'
import {spawnParticles, wallParticles} from "../utils/ParticleHelper";
import {Shadow} from "../utils/shadow";
import {Player} from "../player";
import {DemonBoss} from "../enemies/bosses/DemonBoss";


export class Bullet extends ex.Actor {
    private shadow: Shadow;

    constructor(offsetDistance: number, pos: ex.Vector, vel: ex.Vector, private resources: GameResources, private collisionGroups: any, private damage: number) {

        const spawnPos = pos.add(vel.normalize().scale(offsetDistance));
        super({
            name: "projectile",
            pos: spawnPos,
            anchor: ex.vec(0.5, 0),
            height: resources.Images.bullet.height,
            width: resources.Images.bullet.width,
            collisionType: ex.CollisionType.Passive,
            collisionGroup: collisionGroups.projectileGroup,
            z: 2
        });
        this.vel = vel;
    }

    onInitialize(engine: ex.Engine): void {
        // Rotate to match movement direction

        const arrowSprite = this.resources.Images.bullet.toSprite();
        this.graphics.use(arrowSprite);
        arrowSprite.width = this.width;
        arrowSprite.height = this.height;
        this.rotation = this.vel.toAngle() + Math.PI / 2;

        this.shadow = new Shadow(this);
        engine.currentScene.add(this.shadow);

    }

    onPostUpdate(_engine: ex.Engine, _delta: number) {

        if (this.shadow) {
            this.shadow.pos = this.pos.add(ex.vec(0, this.height/2 - 2));
        }

    }

    onCollisionStart(_self: ex.Collider, other: ex.Collider) {
        console.log("collision started");
        if (other.owner instanceof Demon || other.owner instanceof DemonBoss) {
            //spawnParticles(this.scene, this.pos, "enemy");
            this.kill()
            this.shadow.kill();
            other.owner.takeDamage(this.damage);
            if (other.owner.isDead) return;
        } else {
            wallParticles(this.scene, this.pos, "wall");
            this.kill()
            this.shadow.kill();
        }
    }

}
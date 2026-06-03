// shadow.ts
const ex = await import("excalibur");
import { Bullet } from '../weapons/bullet'
import {GreatSword} from "../weapons/sword";

export class Shadow extends ex.Actor {

    constructor(parent: ex.Actor) {
        super({
            pos: parent.pos.clone(),
            anchor: ex.vec(0.5, 0.5),
            z: parent.z - 1, // draw underneath
        });

        let radius;

        if (parent instanceof Bullet) {
            radius = parent.width;
        } else if (parent instanceof GreatSword) {
            radius = parent.height / 3;
            this.z = parent.z - 3;
        } else {
            radius = parent.width * 0.4;
        }

        // Use a circle collider (for size only, collision disabled)
        this.collider.useCircleCollider(radius);
        this.body.collisionType = ex.CollisionType.PreventCollision; // no collisions

        // Draw the shadow
        this.graphics.use(
            new ex.Circle({
                radius,
                color: ex.Color.fromRGB(0, 0, 0, 0.3),
            })
        );

        // Squash using scaling like your original code
        this.scale = ex.vec(1.5, 0.8);
    }
}

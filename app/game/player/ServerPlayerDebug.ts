// ServerPlayerDebug.ts
import * as ex from "excalibur";

export class ServerPlayerDebug extends ex.Actor {
    constructor() {
        super({
            width: 16,
            height: 16,
            z: 9999,
            collisionType: ex.CollisionType.PreventCollision,
        });

        this.graphics.use(
            new ex.Rectangle({
                width: 16,
                height: 16,
                color: ex.Color.Red,
            })
        );
    }
}
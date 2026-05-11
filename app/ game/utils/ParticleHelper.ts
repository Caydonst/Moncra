const ex = await import("excalibur");

/**
 * Spawns a burst of particles at a position.
 *
 * @param scene - The scene to spawn particles in
 * @param pos - ex.Vector position
 * @param collisionType - ex.Vector position
 * @param options - optional config
 */

export class ParticleManager {
    private emitter: ex.ParticleEmitter;

    constructor(private scene: ex.Scene) {
        this.emitter = new ex.ParticleEmitter({
            pos: ex.vec(0, 0),
            z: 0,
            emitterType: ex.EmitterType.Circle,
            radius: 1,
            isEmitting: false,
            emitRate: 100,
            particle: {
                life: 400,
                minSpeed: 0,
                maxSpeed: 0,
                minAngle: 0,
                maxAngle: Math.PI * 2,
                opacity: 1,
                fade: true,
                minSize: 3,
                maxSize: 3,
                startSize: 3,
                endSize: 3,
                beginColor: ex.Color.fromHex("#5c5c5c"),
                endColor: ex.Color.Transparent,
                z: 0,
            },
        })

        scene.add(this.emitter);
    }

    emit(
        pos: ex.Vector, 
        count = 1,
        color = this.emitter.particle.beginColor,
        minSpeed = this.emitter.particle.minSpeed,
        maxSpeed = this.emitter.particle.maxSpeed,
        life = this.emitter.particle.life,
        startSize = this.emitter.particle.startSize,
        endSize = this.emitter.particle.endSize,
        z = this.emitter.particle.z,
    ) {
        this.emitter.pos = pos.clone();
        this.emitter.particle.beginColor = color;
        this.emitter.particle.minSpeed = minSpeed;
        this.emitter.particle.maxSpeed = maxSpeed;
        this.emitter.particle.life = life;
        this.emitter.particle.startSize = startSize;
        this.emitter.particle.endSize = endSize;
        this.emitter.particle.z = z;
        this.emitter.emitParticles(count);
    }
}

export function spawnParticles(
    scene: ex.Scene,
    pos: ex.Vector,
    collisionType: string,
    options?: {
        count?: number;
        colors?: string;
        minSpeed?: number;
        maxSpeed?: number;
        minLife?: number;
        maxLife?: number;
        size?: number;
        endSize?: number;
        endColor?: string;
        z?: number;
    }
) {
    const {
        count = 12,
        colors = collisionType === "enemy" ? "#ffd500" : "#A88A88",
        minSpeed = 80,
        maxSpeed = 100,
        minLife = 50,
        maxLife = 100,
        size = 2,
        endSize = 0.3,
        z = 0,
    } = options || {};

    const square = new ex.Rectangle({
        width: 4,
        height: 4,
        color: ex.Color.Yellow,
    });

    const emitter = new ex.ParticleEmitter({
        pos: pos.clone(),
        z,
        emitterType: ex.EmitterType.Circle,
        radius: 1,
        isEmitting: false,
        emitRate: count,
        particle: {
            life: maxLife,
            minSpeed,
            maxSpeed,
            minAngle: 0,
            maxAngle: Math.PI * 2,
            opacity: 1,
            fade: true,
            minSize: size,
            maxSize: size,
            startSize: size,
            endSize: size * endSize,
            beginColor: ex.Color.fromHex(colors),
            endColor: ex.Color.Transparent,
            z: 1,
        },
    });

    scene.add(emitter);

    emitter.emitParticles(count);

    scene.engine.clock.schedule(() => {
        emitter.kill();
    }, maxLife + 50);
}


export function wallParticles(
    scene: ex.Scene,
    pos: ex.Vector,
    collisionType: string,
    options?: {
        count?: number,
        colors?: ex.Color[],
        minSpeed?: number,
        maxSpeed?: number,
        minLife?: number,
        maxLife?: number,
        size?: number,
        enemy?: string,
    }
) {
    const {
        count = 12,
        colors = collisionType === "enemy" ? "#FFFFFF" : "#A88A88",
        minSpeed = 20,
        maxSpeed = 40,
        minLife = 300,
        maxLife = 500,
        size = 4,
    } = options || {};

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const life = minLife + Math.random() * (maxLife - minLife);

        const dir = ex.vec(Math.cos(angle), Math.sin(angle));

        // particle actor
        const p = new ex.Actor({
            pos: pos.clone(),
            radius: size,
            z: 5,
            color: ex.Color.fromHex(colors),
            anchor: ex.vec(0.5, 0.5),
            collisionType: ex.CollisionType.PreventCollision,
            opacity: 1
        });

        scene.add(p);

        p.actions.clearActions();

        const target = pos.add(dir.scale(speed * 2));

        // run actions in parallel safely
        p.actions.runAction(
            new ex.ParallelActions([
                new ex.MoveTo(p, target.x, target.y, speed),
                new ex.Fade(p, 0, life),
                new ex.ScaleTo(p, 0.3, 0.3, 2, 2)
            ])
        ).callMethod(() => p.kill());
    }
}

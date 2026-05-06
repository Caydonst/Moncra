const ex = await import("excalibur");

type Particle = {
    active: boolean;
    pos: ex.Vector;
    vel: ex.Vector;
    life: number;
    maxLife: number;
    size: number;
    color: ex.Color;
};

export class ParticleSystem extends ex.Actor {
    private particles: Particle[] = [];

    constructor(private maxParticles = 300) {
        super({
            pos: ex.vec(0, 0),
            anchor: ex.vec(0, 0),
            width: 1920,
            height: 1080,
            z: 9999,
            collisionType: ex.CollisionType.PreventCollision,
        });

        for (let i = 0; i < maxParticles; i++) {
            this.particles.push({
                active: false,
                pos: ex.vec(0, 0),
                vel: ex.vec(0, 0),
                life: 0,
                maxLife: 0,
                size: 2,
                color: ex.Color.White,
            });
        }

        this.graphics.use(
            new ex.Rectangle({
                width: 1,
                height: 1,
                color: ex.Color.Transparent,
            })
        );

        this.graphics.onPostDraw = (ctx) => {
            this.drawParticles(ctx);
        };
    }

    emitBurst(
        pos: ex.Vector,
        options?: {
            count?: number;
            color?: ex.Color;
            minSpeed?: number;
            maxSpeed?: number;
            minLife?: number;
            maxLife?: number;
            size?: number;
        }
    ) {
        const {
            count = 8,
            color = ex.Color.Yellow,
            minSpeed = 80,
            maxSpeed = 120,
            minLife = 100,
            maxLife = 200,
            size = 2,
        } = options || {};

        for (let i = 0; i < count; i++) {
            const particle = this.particles.find(p => !p.active);
            if (!particle) return;

            const angle = Math.random() * Math.PI * 2;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

            particle.active = true;
            particle.pos = pos.clone();
            particle.vel = ex.vec(Math.cos(angle), Math.sin(angle)).scale(speed);
            particle.life = minLife + Math.random() * (maxLife - minLife);
            particle.maxLife = particle.life;
            particle.size = size;
            particle.color = color;
        }

        console.log("emit burst", pos);
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        const seconds = delta / 1000;

        for (const p of this.particles) {
            if (!p.active) continue;

            p.life -= delta;

            if (p.life <= 0) {
                p.active = false;
                continue;
            }

            p.pos = p.pos.add(p.vel.scale(seconds));
            p.vel = p.vel.scale(0.94);
        }
    }

    private drawParticles(ctx: CanvasRenderingContext2D) {
        const engine = this.scene?.engine;
        if (!engine) return;

        for (const p of this.particles) {
            if (!p.active) continue;

            const screenPos = engine.worldToScreenCoordinates(p.pos);
            const alpha = p.life / p.maxLife;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color.toRGBA();

            ctx.fillRect(
                screenPos.x - p.size / 2,
                screenPos.y - p.size / 2,
                p.size,
                p.size
            );
        }

        ctx.globalAlpha = 1;
    }
}
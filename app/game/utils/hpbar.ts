const ex = await import("excalibur");

export class HPBar extends ex.Actor {
    private owner: ex.Actor;
    private widthPx: number;
    private heightPx: number;
    private hp: number;
    private maxHp: number;
    private displayedHp: number;
    private actorType: string;
    private enemyType: string;

    constructor(parent: ex.Actor, width: number, height: number, maxHp: number, actorType: string, enemyType: string) {
        super({
            pos: parent.pos.clone(),
            anchor: ex.vec(0.5, 0.5),
            z: parent.z,
            collisionType: ex.CollisionType.PreventCollision
        });

        this.owner = parent;
        this.widthPx = width;
        this.heightPx = height;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.displayedHp = maxHp;
        this.actorType = actorType;
        this.enemyType = enemyType;

        // Disable body so it never collides
        this.body.collisionType = ex.CollisionType.PreventCollision;

        // We'll draw manually using graphics.onPostDraw
        this.graphics.onPostDraw = (ctx) => this.drawBar(ctx);
    }

    /** Called when the parent takes damage */
    public setHP(newHP: number) {
        this.hp = Math.max(0, Math.min(newHP, this.maxHp));
    }

    private drawBar(ctx: ex.ExcaliburGraphicsContext) {
        const barWidth = Math.round(this.widthPx / 2) * 2;
        const barHeight = Math.round(this.heightPx / 2) * 2;

        const x = -barWidth / 2;
        const y = this.actorType === "player" ? 24 : 25;

        const borderSize = 0;

        // Outer border
        ctx.drawRectangle(
            ex.vec(x - borderSize, y - borderSize),
            barWidth + borderSize * 2,
            barHeight + borderSize * 2,
            ex.Color.White
        );

        // Inner background
        ctx.drawRectangle(
            ex.vec(x, y),
            barWidth,
            barHeight,
            ex.Color.Black
        );

        const hpWidth = Math.round(
            (this.hp / this.maxHp) * barWidth
        );

        const displayedWidth = Math.round(
            (this.displayedHp / this.maxHp) * barWidth
        );

        const trailingWidth = Math.max(
            0,
            displayedWidth - hpWidth
        );

        const trailingColor =
            this.actorType === "player"
                ? ex.Color.fromHex("#9EFFA9")
                : ex.Color.fromHex("#FFBFBF");

        if (trailingWidth > 0) {
            ctx.drawRectangle(
                ex.vec(x + hpWidth, y),
                trailingWidth,
                barHeight,
                trailingColor
            );
        }

        let hpColor = ex.Color.fromHex("#008224");

        if (this.actorType === "enemy") {
            hpColor =
                this.enemyType === "large"
                    ? ex.Color.fromHex("#FF7F7F")
                    : ex.Color.fromHex("#FF0000");
        }

        if (hpWidth > 0) {
            ctx.drawRectangle(
                ex.vec(x, y),
                hpWidth,
                barHeight,
                hpColor
            );
        }
    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        const offsetY = this.owner.height + 5;

        this.pos = ex.vec(
            Math.round(this.owner.pos.x),
            Math.round(this.owner.pos.y - offsetY)
        );

        const smoothing = 1 - Math.pow(0.001, delta / 1000);

        this.displayedHp +=
            (this.hp - this.displayedHp) * smoothing;

        if (Math.abs(this.displayedHp - this.hp) < 0.01) {
            this.displayedHp = this.hp;
        }
    }
}

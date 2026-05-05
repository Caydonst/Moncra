const ex = await import("excalibur");

export class HPBar extends ex.Actor {
    private owner: ex.Actor;
    private widthPx: number;
    private heightPx: number;
    private hp: number;
    private maxHp: number;
    private displayedHp: number;
    private actorType: string;

    constructor(parent: ex.Actor, width: number, height: number, maxHp: number, actorType: string) {
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
        const barWidth = this.widthPx;
        const barHeight = this.heightPx;

        if (this.actorType === "player") {
            const x = -barWidth / 2;
            const y = 24;
            // → Border (white)
            ctx.drawRectangle(ex.vec(x - 1, y - 1), barWidth + 2, barHeight + 2, ex.Color.White);

            // → Background (black)
            ctx.drawRectangle(ex.vec(x, y), barWidth, barHeight, ex.Color.Black);

            // → HP widths
            const hpWidth = (this.hp / this.maxHp) * barWidth;
            const displayedWidth = (this.displayedHp / this.maxHp) * barWidth;

            // → Smooth trailing damage (light red)
            ctx.drawRectangle(
                ex.vec(x + hpWidth, y),
                displayedWidth - hpWidth,
                barHeight,
                ex.Color.fromHex("#9EFFA9")
            );

            // → Current HP (red)
            ctx.drawRectangle(ex.vec(x, y), hpWidth, barHeight, ex.Color.fromHex("#008224"));
        } else if (this.actorType === "enemy") {
            const x = -barWidth / 2;
            const y = 10;
            // → Border (white)
            ctx.drawRectangle(ex.vec(x - 1, y - 1), barWidth + 2, barHeight + 2, ex.Color.White);

            // → Background (black)
            ctx.drawRectangle(ex.vec(x, y), barWidth, barHeight, ex.Color.Black);

            // → HP widths
            const hpWidth = (this.hp / this.maxHp) * barWidth;
            const displayedWidth = (this.displayedHp / this.maxHp) * barWidth;

            // → Smooth trailing damage (light red)
            ctx.drawRectangle(
                ex.vec(x + hpWidth, y),
                displayedWidth - hpWidth,
                barHeight,
                ex.Color.fromHex("#FFBFBF")
            );

            // → Current HP (red)
            ctx.drawRectangle(ex.vec(x, y), hpWidth, barHeight, ex.Color.fromHex("#FF3D3D"));
        }

    }

    onPostUpdate(_engine: ex.Engine, delta: number) {
        const offsetY = this.owner.height + 15;  // 15 px above the head
        this.pos = this.owner.pos.sub(ex.vec(0, offsetY));

        const lerp = 0.02;
        this.displayedHp += (this.hp - this.displayedHp) * lerp;
    }
}

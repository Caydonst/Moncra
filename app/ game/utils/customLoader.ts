// CustomLoader.ts
import * as ex from "excalibur";

export class CustomLoader extends ex.DefaultLoader {
    override onDraw(ctx: CanvasRenderingContext2D) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "white";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Loading...", width / 2, height / 2 - 40);

        const barWidth = 300;
        const barHeight = 16;
        const x = width / 2 - barWidth / 2;
        const y = height / 2;

        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "white";
        ctx.fillRect(x, y, barWidth * this.progress, barHeight);
    }

    override async onUserAction(): Promise<void> {
        return Promise.resolve();
    }
}
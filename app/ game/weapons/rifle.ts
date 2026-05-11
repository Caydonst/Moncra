import { Gun } from "./gun";

export class Rifle extends Gun {
    protected getBulletCooldown() {
        return 160
    }
    protected override getSpread() {
        return 0;
    }

    protected override getBulletSpeed() {
        return 2000;
    }

    protected override getReloadTime() {
        return 1700;
    }

    protected override playShootSound() {
        this.resources.sounds.pistol?.shoot?.play(0.02);
    }

    protected override playReloadSound() {
        this.resources.sounds.rifle?.reload?.play(0.1);
    }
}
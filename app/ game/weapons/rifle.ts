import { Gun } from "./gun";

export class Rifle extends Gun {
    protected getBulletCooldown() {
        return 130
    }
    protected override getSpread() {
        return 0;
    }

    protected override getBulletSpeed() {
        return 4000;
    }

    protected override getReloadTime() {
        return 1700;
    }

    protected override playShootSound() {
        this.resources.sounds.rifle?.shoot?.play(0.5);
    }

    protected override playReloadSound() {
        this.resources.sounds.rifle?.reload?.play(0.1);
    }
}
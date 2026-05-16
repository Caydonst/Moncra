import { Gun } from "./bow";

export class Pistol extends Gun {
    protected getBulletCooldown() {
        return 300;
    }
    protected override getSpread() {
        return 0;
    }

    protected override getBulletSpeed() {
        return 1300;
    }

    protected override getReloadTime() {
        return 1700;
    }

    protected override playShootSound() {
        this.resources.sounds.pistol?.shoot?.play(0.02);
    }

    protected override playReloadSound() {
        const sound = this.resources.sounds.pistol?.reload;
        if (sound) sound.playbackRate = 1.3;
        sound?.play(0.1);
    }
}

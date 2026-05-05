import { Gun } from "./gun";

export class Pistol extends Gun {
    protected getBulletCooldown() {
        return 300;
    }
    protected override getSpread() {
        return 0.05;
    }

    protected override getBulletSpeed() {
        return 4000;
    }

    protected override getReloadTime() {
        return 1700;
    }

    protected override playShootSound() {
        this.resources.sounds.pistol?.shoot?.play(0.1);
    }

    protected override playReloadSound() {
        const sound = this.resources.sounds.pistol?.reload;
        if (sound) sound.playbackRate = 1.3;
        sound?.play(0.1);
    }
}

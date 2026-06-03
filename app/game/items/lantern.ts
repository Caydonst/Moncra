import * as ex from "excalibur"

export class Lantern {
    constructor(private time: number, private tier: number, private level: number, private image: ex.ImageSource) {
        this.time = time;
        this.tier = tier;
        this.level = level;
        this.image = image;
    }

    public getTier() {
        return this.tier;
    }

    public getTime() {
        return this.time;
    }

    public getLevel() {
        return this.level;
    }

    public getImage() {
        return this.image;
    }
}
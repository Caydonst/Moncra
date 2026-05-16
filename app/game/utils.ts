import * as ex from 'excalibur'

export function createGlowSprite(image: ex.ImageSource, options = {}) {
    const glowColor = options.color ?? ex.Color.Yellow;
    const blur = options.blur ?? 15;             // how soft the glow is
    const scale = options.scale ?? 1.2;          // glow size relative to sprite

    const base = image.toSprite();

    // Create glow version
    const glow = image.toSprite();
    glow.tint = glowColor;
    glow.scale = new ex.Vector(scale, scale);

    // Excalibur 0.30+ supports effects:
    glow.effects.blur(blur);

    // Return both layers
    return [glow, base];
}
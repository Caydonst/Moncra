const ex = await import("excalibur");

export class Outline {
    private readonly outline: string;
    public outlineMaterial: ex.Material;

    constructor(game: ex.Engine) {
        this.outline = `#version 300 es
        precision mediump float;
        
        uniform float u_time_ms;
        uniform sampler2D u_graphic;
        uniform vec2 u_graphic_resolution;
        
        in vec2 v_uv;
        in vec2 v_screenuv;
        out vec4 fragColor;
        
        vec2 uv_iq(in vec2 uv, in vec2 texture_size) {
          vec2 pixel = uv * texture_size;
        
          vec2 seam = floor(pixel + 0.5);
          vec2 dudv = fwidth(pixel);
          pixel = seam + clamp((pixel - seam) / dudv, -0.5, 0.5);
        
          return pixel / texture_size;
        }
        
        void main() {
            vec2 texel = 1.0 / u_graphic_resolution;

            // Keep the actual sword pixel-perfect
            vec2 pixelUV = uv_iq(v_uv, u_graphic_resolution);
            vec4 mat = texture(u_graphic, pixelUV);

            float glow = 0.0;

            // Smooth multi-ring glow
            for (float radius = 0.5; radius <= 1.5; radius += 0.5) {
                float strength = 1.0 - (radius / 6.0);

                // cardinal samples
                glow += texture(u_graphic, v_uv + vec2(texel.x * radius, 0.0)).a * strength;
                glow += texture(u_graphic, v_uv + vec2(-texel.x * radius, 0.0)).a * strength;
                glow += texture(u_graphic, v_uv + vec2(0.0, texel.y * radius)).a * strength;
                glow += texture(u_graphic, v_uv + vec2(0.0, -texel.y * radius)).a * strength;

                // diagonal samples, slightly weaker
                glow += texture(u_graphic, v_uv + vec2(texel.x * radius, texel.y * radius)).a * strength * 0.7;
                glow += texture(u_graphic, v_uv + vec2(-texel.x * radius, texel.y * radius)).a * strength * 0.7;
                glow += texture(u_graphic, v_uv + vec2(texel.x * radius, -texel.y * radius)).a * strength * 0.7;
                glow += texture(u_graphic, v_uv + vec2(-texel.x * radius, -texel.y * radius)).a * strength * 0.7;
            }

            glow = clamp(glow * 0.2, 0.0, 1.0);

            // Do not draw glow over the sword itself
            float spriteMask = smoothstep(0.01, 0.8, base.a);
            float glowMask = glow * (1.0 - spriteMask);

            vec3 glowColor = vec3(0.607, 0.972, 1.0);
            float glowAlpha = 0.7;

            fragColor = vec4(glowColor, glowAlpha * glowMask);

            // Draw original sword on top
            fragColor = mix(fragColor, vec4(mat.rgb, 1.0), spriteMask);
            fragColor.rgb *= fragColor.a;
        }
        `;

        this.outlineMaterial = game.graphicsContext.createMaterial({
            name: 'outline',
            fragmentSource: this.outline
        });
    }
}


export class EnchantEffect {
    private readonly shader: string;
    public enchantMaterial: ex.Material;

    constructor(game: ex.Engine) {
        this.shader = `#version 300 es
        precision mediump float;

        uniform float u_time_ms;
        uniform sampler2D u_graphic;
        uniform vec2 u_graphic_resolution;

        in vec2 v_uv;
        in vec2 v_screenuv;
        out vec4 fragColor;

        vec2 uv_iq(in vec2 uv, in vec2 texture_size) {
            vec2 pixel = uv * texture_size;

            vec2 seam = floor(pixel + 0.5);
            vec2 dudv = fwidth(pixel);
            pixel = seam + clamp((pixel - seam) / dudv, -0.5, 0.5);

            return pixel / texture_size;
        }

        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(a, b, u.x) +
                (c - a) * u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
        }

        void main() {
            float time = u_time_ms / 1000.0;

            vec4 base = texture(u_graphic, v_uv);

            if (base.a < 0.5) {
                fragColor = vec4(0.0);
                return;
            }

            float movingNoise = smoothNoise(v_uv * 10.0 + vec2(time * 0.7, -time * 0.45));
            float fineNoise = smoothNoise(v_uv * 28.0 + vec2(-time * 1.2, time * 0.9));

            float enchantMask = movingNoise * 0.65 + fineNoise * 0.35;
            enchantMask = smoothstep(0.45, 0.95, enchantMask);

            vec3 enchantColorA = vec3(0.65, 0.25, 1.0);
            vec3 enchantColorB = vec3(0.25, 0.85, 1.0);

            float colorShift = sin(time * 2.0 + (v_uv.x + v_uv.y) * 8.0) * 0.5 + 0.5;
            vec3 enchantColor = mix(enchantColorA, enchantColorB, colorShift);

            vec3 tinted = mix(base.rgb, enchantColor, 0.18);
            tinted += enchantColor * enchantMask * 0.35;

            fragColor = vec4(tinted, base.a);
            fragColor.rgb *= fragColor.a;
        }
        `;

        this.enchantMaterial = game.graphicsContext.createMaterial({
            name: "enchant-effect",
            fragmentSource: this.shader
        });
    }
}

export class EnchantedGlowEffect {
    private readonly shader: string;
    public material: ex.Material;

    constructor(game: ex.Engine) {
        this.shader = `#version 300 es
        precision mediump float;

        uniform float u_time_ms;
        uniform sampler2D u_graphic;
        uniform vec2 u_graphic_resolution;

        in vec2 v_uv;
        in vec2 v_screenuv;
        out vec4 fragColor;

        vec2 uv_iq(in vec2 uv, in vec2 texture_size) {
            vec2 pixel = uv * texture_size;
            vec2 seam = floor(pixel + 0.5);
            vec2 dudv = fwidth(pixel);
            pixel = seam + clamp((pixel - seam) / dudv, -0.5, 0.5);
            return pixel / texture_size;
        }

        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(a, b, u.x) +
                (c - a) * u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
        }

        void main() {
            float time = u_time_ms / 1000.0;

            vec2 texel = 1.0 / u_graphic_resolution;
            vec2 pixelUV = uv_iq(v_uv, u_graphic_resolution);

            vec4 base = texture(u_graphic, pixelUV);

            // -------------------------
            // Glow around the sword
            // -------------------------
            float glow = 0.0;

            for (float radius = 0.5; radius <= 1.0; radius += 0.5) {
                float strength = 1.0 - (radius / 6.0);

                glow += texture(u_graphic, v_uv + vec2(texel.x * radius, 0.0)).a * strength;
                glow += texture(u_graphic, v_uv + vec2(-texel.x * radius, 0.0)).a * strength;
                glow += texture(u_graphic, v_uv + vec2(0.0, texel.y * radius)).a * strength;
                glow += texture(u_graphic, v_uv + vec2(0.0, -texel.y * radius)).a * strength;

                glow += texture(u_graphic, v_uv + vec2(texel.x * radius, texel.y * radius)).a * strength * 0.7;
                glow += texture(u_graphic, v_uv + vec2(-texel.x * radius, texel.y * radius)).a * strength * 0.7;
                glow += texture(u_graphic, v_uv + vec2(texel.x * radius, -texel.y * radius)).a * strength * 0.7;
                glow += texture(u_graphic, v_uv + vec2(-texel.x * radius, -texel.y * radius)).a * strength * 0.7;
            }

            glow = clamp(glow * 0.2, 0.0, 1.0);

            float spriteMask = smoothstep(0.01, 0.8, base.a);
            float glowMask = glow * (1.0 - spriteMask);

            vec3 glowColor = vec3(0.607, 0.972, 1.0);
            float glowAlpha = 0.7;

            vec4 glowLayer = vec4(glowColor, glowAlpha * glowMask);

            // -------------------------
            // Enchant overlay on sword
            // -------------------------
            float flow =
                sin(v_uv.y * 20.0 - time * 5.0);

            flow +=
                sin(v_uv.y * 10.0 + time * 3.0) * 0.5;

            flow +=
                sin(v_uv.y * 40.0 - time * 8.0) * 0.15;

            float enchantMask =
                smoothstep(0.8, 1.2, flow);

            vec3 enchantColorA = vec3(0.65, 0.25, 1.0);
            vec3 enchantColorB = vec3(0.25, 0.85, 1.0);

            float colorShift = sin(time * 4.0 + (v_uv.x + v_uv.y) * 8.0) * 0.5 + 0.5;
            vec3 enchantColor = mix(enchantColorA, enchantColorB, colorShift);

            vec3 enchantedSword = mix(base.rgb, enchantColor, 0.18);
            enchantedSword += enchantColor * enchantMask * 0.35;

            vec4 swordLayer = vec4(enchantedSword, base.a);

            // -------------------------
            // Composite
            // -------------------------
            fragColor = glowLayer;
            fragColor = mix(fragColor, swordLayer, spriteMask);

            fragColor.rgb *= fragColor.a;
        }
        `;

        this.material = game.graphicsContext.createMaterial({
            name: "enchanted-glow-effect",
            fragmentSource: this.shader
        });
    }
}
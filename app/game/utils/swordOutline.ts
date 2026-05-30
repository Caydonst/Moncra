const ex = await import("excalibur");

export class Outline {
    private readonly outline: string;
    public outlineMaterial: ex.Material;

    constructor(game: ex.Engine) {
        this.outline = `#version 300 es
        precision mediump float;
        
        uniform float u_time_ms;
        uniform sampler2D u_graphic;
        uniform vec2 u_graphic_resolution;   // <-- REQUIRED by uv_iq()
        
        in vec2 v_uv;
        in vec2 v_screenuv;
        out vec4 fragColor;
        
        // ======================================================
        //     IQ PIXEL ART FILTER (Excalibur docs version)
        // ======================================================
        vec2 uv_iq(in vec2 uv, in vec2 texture_size) {
          vec2 pixel = uv * texture_size;
        
          vec2 seam = floor(pixel + 0.5);
          vec2 dudv = fwidth(pixel);
          pixel = seam + clamp((pixel - seam) / dudv, -0.5, 0.5);
        
          return pixel / texture_size;
        }
        
        void main() {
            vec2 texel = 1.0 / u_graphic_resolution;
            vec2 pixelUV = uv_iq(v_uv, u_graphic_resolution);

            vec4 mat = texture(u_graphic, pixelUV);

            vec4 outline = vec4(0.0);

            outline += texture(u_graphic, uv_iq(v_uv + vec2(texel.x, 0.0), u_graphic_resolution));
            outline += texture(u_graphic, uv_iq(v_uv + vec2(-texel.x, 0.0), u_graphic_resolution));
            outline += texture(u_graphic, uv_iq(v_uv + vec2(0.0, texel.y), u_graphic_resolution));
            outline += texture(u_graphic, uv_iq(v_uv + vec2(0.0, -texel.y), u_graphic_resolution));

            float outlineMask =
                step(0.01, outline.a) *
                (1.0 - step(0.01, mat.a));

            vec4 outlineColor = vec4(0.607, 0.972, 1, 0.7);

            fragColor = outlineColor * outlineMask;

            float spriteMask = step(0.01, mat.a);
            fragColor = mix(fragColor, mat, spriteMask);

            fragColor.rgb *= fragColor.a;
        }
        `;

        this.outlineMaterial = game.graphicsContext.createMaterial({
            name: 'outline',
            fragmentSource: this.outline
        });
    }
}


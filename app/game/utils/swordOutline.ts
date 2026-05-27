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
        
        // Hue → RGB helper
        vec3 hsv2rgb(vec3 c){
          vec4 K=vec4(1.,2./3.,1./3.,3.);
          return c.z * mix(
              K.xxx,
              clamp(abs(fract(c.x + K.xyz) * 6. - K.w) - K.x, 0., 1.),
              c.y
          );
        }
        
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
            float time_sec = u_time_ms / 1000.0;
        
            // your animated hue outline color
            vec3 outlineHSL = vec3(sin(time_sec / 2.0), 1.0, 1.0);
        
            // size of 1 pixel in UV space
            vec2 texel = 1.0 / u_graphic_resolution;
        
            // ======================================================
            //         FIXED PIXEL-ART FILTERED UV FOR SAMPLES
            // ======================================================
            vec2 pixelUV = uv_iq(v_uv, u_graphic_resolution);
        
            // accumulate outline coverage from neighbors
            vec4 outline = vec4(0.0);
        
            // 1-pixel cardinal neighbors
            outline += texture(u_graphic, uv_iq(v_uv + vec2(texel.x, 0.0),     u_graphic_resolution));
            outline += texture(u_graphic, uv_iq(v_uv + vec2(-texel.x, 0.0),    u_graphic_resolution));
            outline += texture(u_graphic, uv_iq(v_uv + vec2(0.0, texel.y),     u_graphic_resolution));
            outline += texture(u_graphic, uv_iq(v_uv + vec2(0.0, -texel.y),    u_graphic_resolution));
        
            // if any neighbor has alpha, we draw the outline
            float alpha = step(0.01, outline.a);
        
            vec4 outlineColor = vec4(hsv2rgb(outlineHSL), 1.0);
        
            // start with outline
            fragColor = outlineColor * alpha;
        
            // draw original sprite (pixel-perfect)
            vec4 mat = texture(u_graphic, pixelUV);
            float factor = smoothstep(0.5, 0.7, mat.a);
        
            // final composite
            fragColor = mix(fragColor, mat, factor);
        
            fragColor.rgb *= fragColor.a; // premultiply alpha
        }
        `;

        this.outlineMaterial = game.graphicsContext.createMaterial({
            name: 'outline',
            fragmentSource: this.outline
        });
    }
}


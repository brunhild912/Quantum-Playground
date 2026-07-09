import * as THREE from 'three'

export type StarMaterialConfig = {
  texture: THREE.Texture
  glowTexture: THREE.Texture
  opacity: number
  sizeScale: number
  maxPointSize: number
}

export function createStarfieldMaterial(config: StarMaterialConfig) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: config.texture },
      uGlowTexture: { value: config.glowTexture },
      uOpacity: { value: config.opacity },
      uTime: { value: 0 },
      uSizeScale: { value: config.sizeScale },
      uMaxPointSize: { value: config.maxPointSize },
    },
    vertexShader: `
      attribute float size;
      attribute float brightness;
      attribute float phase;
      attribute float twinkleSpeed;
      attribute float glow;
      attribute vec3 starColor;

      uniform float uTime;
      uniform float uSizeScale;
      uniform float uMaxPointSize;

      varying float vAlpha;
      varying vec3 vColor;
      varying float vGlow;

      void main() {
        float twinkle = 0.96 + 0.04 * sin(uTime * twinkleSpeed + phase);
        vAlpha = brightness * twinkle;
        vColor = starColor;
        vGlow = glow;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = max(-mvPosition.z, 50.0);
        float screenSize = size * (uSizeScale / dist);
        gl_PointSize = clamp(screenSize, 0.6, uMaxPointSize);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform sampler2D uGlowTexture;
      uniform float uOpacity;

      varying float vAlpha;
      varying vec3 vColor;
      varying float vGlow;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        if (dot(uv, uv) > 0.25) discard;

        vec4 pinpoint = texture2D(uTexture, gl_PointCoord);
        vec4 halo = texture2D(uGlowTexture, gl_PointCoord);
        vec4 tex = mix(pinpoint, halo, vGlow);

        float alpha = tex.a * vAlpha * uOpacity;
        if (alpha < 0.001) discard;

        gl_FragColor = vec4(vColor * tex.rgb, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  })
}

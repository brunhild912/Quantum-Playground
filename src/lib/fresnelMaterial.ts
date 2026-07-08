import * as THREE from 'three'

export function createFresnelMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#c8dce8') },
      uRimColor: { value: new THREE.Color('#e8f0f8') },
      uPower: { value: 2.8 },
      uIntensity: { value: 0.22 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uRimColor;
      uniform float uPower;
      uniform float uIntensity;

      varying vec3 vNormal;
      varying vec3 vViewDirection;

      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vViewDirection)));
        float fresnel = pow(1.0 - facing, uPower);
        vec3 color = mix(uColor, uRimColor, fresnel);
        gl_FragColor = vec4(color, fresnel * uIntensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  })
}

import { useMemo } from 'react'
import * as THREE from 'three'

const SKY_RADIUS = 180

export default function SpaceBackdrop() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {},
      vertexShader: `
        varying vec3 vDirection;

        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDirection;

        void main() {
          vec3 dir = normalize(vDirection);

          vec3 deep = vec3(0.012, 0.024, 0.058);
          vec3 mid = vec3(0.022, 0.04, 0.085);

          float horizon = smoothstep(-0.3, 0.5, dir.y);
          vec3 base = mix(deep, mid, horizon * 0.38);

          float nebulaWarm = smoothstep(0.15, 0.88, sin(dir.x * 2.8 + dir.z * 2.1) * 0.5 + 0.5);
          nebulaWarm *= smoothstep(-0.1, 0.65, dir.y + 0.15);
          vec3 warmDust = vec3(0.14, 0.05, 0.03) * nebulaWarm * 0.14;

          float nebulaCool = smoothstep(0.25, 0.9, sin(dir.x * 2.0 - dir.y * 1.6 + 0.8) * 0.5 + 0.5);
          vec3 coolDust = vec3(0.03, 0.06, 0.14) * nebulaCool * 0.16;

          float nebulaAmber = smoothstep(0.35, 0.92, sin(dir.z * 3.2 + dir.y * 1.4) * 0.5 + 0.5);
          vec3 amberDust = vec3(0.1, 0.04, 0.02) * nebulaAmber * 0.1;

          vec3 color = base + warmDust + coolDust + amberDust;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
  }, [])

  return (
    <mesh renderOrder={-3} frustumCulled={false}>
      <sphereGeometry args={[SKY_RADIUS, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

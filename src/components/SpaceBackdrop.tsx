import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getOpeningSequence, getSequenceElapsed } from '../lib/openingSequence'

const SKY_RADIUS = 180

export default function SpaceBackdrop() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec3 vDirection;

        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vDirection;

        void main() {
          vec3 dir = normalize(vDirection);
          vec3 deep = vec3(0.004, 0.005, 0.010);
          vec3 mid  = vec3(0.010, 0.014, 0.022);

          float horizon = smoothstep(-0.3, 0.5, dir.y);
          vec3 base = mix(deep, mid, horizon * 0.38);

          float nebulaWarm = smoothstep(0.15, 0.88, sin(dir.x * 2.8 + dir.z * 2.1) * 0.5 + 0.5);
          nebulaWarm *= smoothstep(-0.1, 0.65, dir.y + 0.15);
          vec3 warmDust = vec3(0.14, 0.05, 0.03) * nebulaWarm * 0.04;

          float nebulaCool = smoothstep(0.25, 0.9, sin(dir.x * 2.0 - dir.y * 1.6 + 0.8) * 0.5 + 0.5);
          vec3 coolDust = vec3(0.03, 0.06, 0.14) * nebulaCool * 0.05;

          float nebulaAmber = smoothstep(0.35, 0.92, sin(dir.z * 3.2 + dir.y * 1.4) * 0.5 + 0.5);
          vec3 amberDust = vec3(0.10, 0.04, 0.02) * nebulaAmber * 0.02;

          vec3 color = base + warmDust + coolDust + amberDust;
          gl_FragColor = vec4(color, uOpacity);
        }
      `,
      transparent: true,
    })
  }, [])

  useFrame(() => {
    const { stars } = getOpeningSequence(getSequenceElapsed())
    material.uniforms.uOpacity!.value = stars
  })

  return (
    <mesh renderOrder={-3} frustumCulled={false}>
      <sphereGeometry args={[SKY_RADIUS, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

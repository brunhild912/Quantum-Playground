import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildStarField, type StarLayerData } from '../lib/starFieldGeneration'
import { createPinpointTexture, createGlowTexture } from '../lib/starTexture'

function createStarMaterial(
  texture: THREE.Texture,
  opacity: number,
  sizeScale: number,
  maxPointSize: number,
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
      uSizeScale: { value: sizeScale },
      uMaxPointSize: { value: maxPointSize },
    },
    vertexShader: `
      attribute float size;
      attribute float brightness;
      attribute float phase;
      attribute float twinkleSpeed;
      attribute vec3 starColor;

      uniform float uTime;
      uniform float uSizeScale;
      uniform float uMaxPointSize;

      varying float vAlpha;
      varying vec3 vColor;

      void main() {
        float twinkle = 0.84 + 0.16 * sin(uTime * twinkleSpeed + phase);
        vAlpha = brightness * twinkle;
        vColor = starColor;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = max(-mvPosition.z, 60.0);
        gl_PointSize = clamp(size * (uSizeScale / dist), 0.3, uMaxPointSize);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;

      varying float vAlpha;
      varying vec3 vColor;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        if (dot(uv, uv) > 0.25) discard;

        vec4 tex = texture2D(uTexture, gl_PointCoord);
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

type StarPointsProps = {
  layer: StarLayerData
  material: THREE.ShaderMaterial
}

function StarPoints({ layer, material }: StarPointsProps) {
  if (layer.positions.length === 0) return null

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[layer.positions, 3]}
        />
        <bufferAttribute attach="attributes-size" args={[layer.sizes, 1]} />
        <bufferAttribute
          attach="attributes-brightness"
          args={[layer.brightness, 1]}
        />
        <bufferAttribute attach="attributes-phase" args={[layer.phases, 1]} />
        <bufferAttribute
          attach="attributes-twinkleSpeed"
          args={[layer.twinkleSpeeds, 1]}
        />
        <bufferAttribute
          attach="attributes-starColor"
          args={[layer.colors, 3]}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

export default function StarField() {
  const layer1Ref = useRef<THREE.Group>(null)
  const layer2Ref = useRef<THREE.Group>(null)
  const layer3Ref = useRef<THREE.Group>(null)

  const pinpointTexture = useMemo(() => createPinpointTexture(), [])
  const glowTexture = useMemo(() => createGlowTexture(), [])

  const layers = useMemo(() => buildStarField(), [])

  const materials = useMemo(
    () => ({
      far: createStarMaterial(pinpointTexture, 0.36, 255, 1.2),
      mid: createStarMaterial(pinpointTexture, 0.4, 200, 3.2),
      nearPoint: createStarMaterial(pinpointTexture, 0.42, 155, 3.2),
      nearGlow: createStarMaterial(glowTexture, 0.46, 155, 7),
    }),
    [pinpointTexture, glowTexture],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime

    materials.far.uniforms.uTime.value = t
    materials.mid.uniforms.uTime.value = t
    materials.nearPoint.uniforms.uTime.value = t
    materials.nearGlow.uniforms.uTime.value = t

    if (layer1Ref.current) {
      layer1Ref.current.rotation.y = t * 0.0015
      layer1Ref.current.rotation.x = Math.sin(t * 0.08) * 0.0008
      layer1Ref.current.rotation.z = Math.cos(t * 0.05) * 0.0005
    }

    if (layer2Ref.current) {
      layer2Ref.current.rotation.y = t * 0.0028 + 0.4
      layer2Ref.current.rotation.x = Math.sin(t * 0.12 + 0.8) * 0.0012
      layer2Ref.current.rotation.z = Math.cos(t * 0.09 + 0.5) * 0.0009
    }

    if (layer3Ref.current) {
      layer3Ref.current.rotation.y = t * 0.0045 + 1.1
      layer3Ref.current.rotation.x = Math.sin(t * 0.18 + 1.6) * 0.0018
      layer3Ref.current.rotation.z = Math.cos(t * 0.15 + 2.0) * 0.0015
    }
  })

  return (
    <group renderOrder={-2}>
      <group ref={layer3Ref}>
        <StarPoints layer={layers.far} material={materials.far} />
      </group>

      <group ref={layer2Ref}>
        <StarPoints layer={layers.mid} material={materials.mid} />
      </group>

      <group ref={layer1Ref}>
        <StarPoints layer={layers.nearPoint} material={materials.nearPoint} />
        <StarPoints layer={layers.nearGlow} material={materials.nearGlow} />
      </group>
    </group>
  )
}

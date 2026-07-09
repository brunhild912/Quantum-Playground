import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { getOpeningSequence, getSequenceElapsed } from '../lib/openingSequence'
import { buildStarfield } from '../lib/starfield/build'
import { createStarfieldMaterial } from '../lib/starfield/material'
import { applyLayerMotion, LAYER_MOTION } from '../lib/starfield/motion'
import type { StarLayerData } from '../lib/starfield/types'
import { createGlowTexture, createPinpointTexture } from '../lib/starTexture'

const BASE_OPACITY = {
  near: 0.52,
  mid: 0.48,
  far: 0.44,
} as const

type StarLayerProps = {
  data: StarLayerData
  material: ReturnType<typeof createStarfieldMaterial>
}

function StarLayer({ data, material }: StarLayerProps) {
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[data.sizes, 1]} />
        <bufferAttribute
          attach="attributes-brightness"
          args={[data.brightness, 1]}
        />
        <bufferAttribute attach="attributes-phase" args={[data.phases, 1]} />
        <bufferAttribute
          attach="attributes-twinkleSpeed"
          args={[data.twinkleSpeeds, 1]}
        />
        <bufferAttribute attach="attributes-glow" args={[data.glows, 1]} />
        <bufferAttribute attach="attributes-starColor" args={[data.colors, 3]} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

export default function StarField() {
  const nearRef = useRef<Group>(null)
  const midRef = useRef<Group>(null)
  const farRef = useRef<Group>(null)

  const pinpoint = useMemo(() => createPinpointTexture(), [])
  const glow = useMemo(() => createGlowTexture(), [])
  const layers = useMemo(() => buildStarfield(), [])

  const materials = useMemo(
    () => ({
      near: createStarfieldMaterial({
        texture: pinpoint,
        glowTexture: glow,
        opacity: BASE_OPACITY.near,
        sizeScale: 145,
        maxPointSize: 15,
      }),
      mid: createStarfieldMaterial({
        texture: pinpoint,
        glowTexture: glow,
        opacity: BASE_OPACITY.mid,
        sizeScale: 210,
        maxPointSize: 7,
      }),
      far: createStarfieldMaterial({
        texture: pinpoint,
        glowTexture: glow,
        opacity: BASE_OPACITY.far,
        sizeScale: 300,
        maxPointSize: 3.2,
      }),
    }),
    [pinpoint, glow],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { stars } = getOpeningSequence(getSequenceElapsed())

    materials.near.uniforms.uOpacity.value = BASE_OPACITY.near * stars
    materials.mid.uniforms.uOpacity.value = BASE_OPACITY.mid * stars
    materials.far.uniforms.uOpacity.value = BASE_OPACITY.far * stars

    materials.near.uniforms.uTime.value = t
    materials.mid.uniforms.uTime.value = t
    materials.far.uniforms.uTime.value = t

    if (nearRef.current) applyLayerMotion(nearRef.current, LAYER_MOTION.near, t)
    if (midRef.current) applyLayerMotion(midRef.current, LAYER_MOTION.mid, t)
    if (farRef.current) applyLayerMotion(farRef.current, LAYER_MOTION.far, t)
  })

  return (
    <group renderOrder={-2}>
      <group ref={farRef}>
        <StarLayer data={layers.far} material={materials.far} />
      </group>
      <group ref={midRef}>
        <StarLayer data={layers.mid} material={materials.mid} />
      </group>
      <group ref={nearRef}>
        <StarLayer data={layers.near} material={materials.near} />
      </group>
    </group>
  )
}

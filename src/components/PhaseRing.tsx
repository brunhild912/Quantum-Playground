import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BLOCH_RADIUS } from '../lib/sceneConstants'

const SEGMENTS = 128
const RING_RADIUS = BLOCH_RADIUS * 1.02
const BASE_OPACITY = 0.2
const PULSE_OPACITY = 0.52
const BASE_COLOR = new THREE.Color('#8ee8ff')
const PULSE_COLOR = new THREE.Color('#c4b5fd')

type PhaseRingProps = {
  /** Absolute phase angle (radians) — rotates the equatorial phase layer. */
  phase: number
  /** 0–1 emphasis while a phase gate animates. */
  pulse?: number
}

/**
 * Equatorial phase layer: a thin glowing ring with a brighter phase marker.
 * A plain ring spun about Y is invisible — the marker makes φ progression readable
 * while the Bloch vector stays fixed.
 */
export default function PhaseRing({ phase, pulse = 0 }: PhaseRingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.LineBasicMaterial>(null)
  const markerMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array((SEGMENTS + 1) * 3)
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2
      const i3 = i * 3
      // Equator in app convention: Y is |0⟩/|1⟩ → circle in XZ.
      positions[i3] = Math.cos(a) * RING_RADIUS
      positions[i3 + 1] = 0
      positions[i3 + 2] = Math.sin(a) * RING_RADIUS
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  // Soft arc dash so the ring itself has orientation (not only the tip marker).
  const dashGeometry = useMemo(() => {
    const dashSegs = 24
    const positions = new Float32Array((dashSegs + 1) * 3)
    const start = -0.28
    const span = 0.56
    for (let i = 0; i <= dashSegs; i++) {
      const a = start + (i / dashSegs) * span
      const i3 = i * 3
      positions[i3] = Math.cos(a) * RING_RADIUS
      positions[i3 + 1] = 0
      positions[i3 + 2] = Math.sin(a) * RING_RADIUS
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((state) => {
    const group = groupRef.current
    const mat = matRef.current
    const markerMat = markerMatRef.current
    const haloMat = haloMatRef.current
    if (!group || !mat) return

    group.rotation.y = phase

    const p = Math.min(1, Math.max(0, pulse))
    const breathe =
      p > 0.02 ? 0 : 0.035 * Math.sin(state.clock.elapsedTime * 0.9)

    mat.opacity = BASE_OPACITY + p * (PULSE_OPACITY - BASE_OPACITY) + breathe
    mat.color.copy(BASE_COLOR).lerp(PULSE_COLOR, p * 0.55)

    if (markerMat) {
      markerMat.opacity = 0.35 + p * 0.45 + breathe
      markerMat.color.copy(BASE_COLOR).lerp(PULSE_COLOR, p * 0.4)
    }
    if (haloMat) {
      haloMat.opacity = 0.07 + p * 0.12 + breathe * 0.5
    }
  })

  return (
    <group ref={groupRef} renderOrder={5}>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial
          ref={matRef}
          color={BASE_COLOR}
          transparent
          opacity={BASE_OPACITY}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      <line>
        <primitive object={dashGeometry} attach="geometry" />
        <lineBasicMaterial
          color="#e8f7ff"
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>

      {/* Phase marker — makes ring rotation observable */}
      <mesh position={[RING_RADIUS, 0, 0]} renderOrder={6}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial
          ref={markerMatRef}
          color={BASE_COLOR}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
        <torusGeometry args={[RING_RADIUS, 0.012, 8, 96]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={BASE_COLOR}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

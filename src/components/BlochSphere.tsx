import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { meditativeFloat } from '../lib/easing'
import { createFresnelMaterial } from '../lib/fresnelMaterial'
import { getOpeningSequence, getSequenceElapsed } from '../lib/openingSequence'
import { BLOCH_RADIUS, SPHERE_CENTER_Y } from '../lib/sceneConstants'
import QubitArrow from './QubitArrow'
import MeasurementParticles from './MeasurementParticles'
import PhaseRing from './PhaseRing'

export { BLOCH_RADIUS }
const SEGMENTS = 160
const LINE_RADIUS = BLOCH_RADIUS * 1.001

function createCirclePoints(
  radius: number,
  segments: number,
  axis: 'xy' | 'xz' | 'yz',
  tilt = 0,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = []

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const cos = Math.cos(angle) * radius
    const sin = Math.sin(angle) * radius

    let point: THREE.Vector3
    switch (axis) {
      case 'xy':
        point = new THREE.Vector3(cos, sin, 0)
        break
      case 'xz':
        point = new THREE.Vector3(cos, 0, sin)
        break
      case 'yz':
        point = new THREE.Vector3(0, cos, sin)
        break
    }

    if (tilt !== 0) {
      point.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt)
    }

    points.push(point)
  }

  return points
}

const LINE_OPACITIES = [0.28, 0.238, 0.238, 0.196, 0.154, 0.154] as const

function applyGridOpacity(grid: THREE.Group, reveal: number) {
  let lineIndex = 0

  grid.traverse((child) => {
    const material = (child as THREE.Object3D & { material?: THREE.Material })
      .material

    if (!material || !('opacity' in material)) return

    if (material.userData.baseOpacity === undefined) {
      const fallback = LINE_OPACITIES[lineIndex] ?? 0.28
      material.userData.baseOpacity =
        typeof material.opacity === 'number' ? material.opacity : fallback
      lineIndex += 1
    }

    const baseOpacity = material.userData.baseOpacity as number
    material.opacity = baseOpacity * reveal
    material.transparent = true
  })
}

function SphereGrid() {
  const equator = useMemo(() => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xz'), [])
  const meridianX = useMemo(() => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xy'), [])
  const meridianY = useMemo(() => createCirclePoints(LINE_RADIUS, SEGMENTS, 'yz'), [])
  const meridianZ = useMemo(
    () => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xy', Math.PI / 2),
    [],
  )
  const latitudeNorth = useMemo(
    () => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xz', Math.PI * 0.18),
    [],
  )
  const latitudeSouth = useMemo(
    () => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xz', -Math.PI * 0.18),
    [],
  )

  const lineColor = '#8ab4cc'
  const lineOpacity = 0.28

  return (
    <group>
      <Line points={equator} color={lineColor} transparent opacity={lineOpacity} />
      <Line points={meridianX} color={lineColor} transparent opacity={lineOpacity * 0.85} />
      <Line points={meridianY} color={lineColor} transparent opacity={lineOpacity * 0.85} />
      <Line points={meridianZ} color={lineColor} transparent opacity={lineOpacity * 0.7} />
      <Line
        points={latitudeNorth}
        color={lineColor}
        transparent
        opacity={lineOpacity * 0.55}
      />
      <Line
        points={latitudeSouth}
        color={lineColor}
        transparent
        opacity={lineOpacity * 0.55}
      />
    </group>
  )
}

export default function BlochSphere({
  focus,
  qubit,
  measurementPulse = 0,
  phase = 0,
  phasePulse = 0,
}: {
  focus: number
  qubit?: { theta: number; phi: number } | null
  measurementPulse?: number
  /** Relative phase for the equatorial phase layer (radians). */
  phase?: number
  /** Emphasis while a phase gate animates (0–1). */
  phasePulse?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const gridRef = useRef<THREE.Group>(null)

  const coreRef = useRef<THREE.MeshBasicMaterial>(null)
  const atmosphereRef = useRef<THREE.MeshBasicMaterial>(null)
  const glassRef = useRef<THREE.MeshPhysicalMaterial>(null)

  const fresnelMaterial = useMemo(() => {
    const material = createFresnelMaterial()
    material.uniforms.uIntensity!.value = 0
    return material
  }, [])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return

    const t = state.clock.elapsedTime
    const { sphere: reveal } = getOpeningSequence(getSequenceElapsed())
    const focusScale = 1 + Math.min(1, Math.max(0, focus)) * 0.12

    group.position.y = SPHERE_CENTER_Y + meditativeFloat(t, 0.1) * reveal
    group.rotation.y = t * 0.08
    group.rotation.x = Math.sin(t * 0.25) * 0.08
    group.rotation.z = Math.sin(t * 0.17) * 0.03
    group.scale.setScalar(focusScale)

    if (coreRef.current) coreRef.current.opacity = 0.04 * reveal
    if (atmosphereRef.current) atmosphereRef.current.opacity = 0.025 * reveal
    if (glassRef.current) glassRef.current.opacity = 0.2 * reveal
    fresnelMaterial.uniforms.uIntensity!.value = 0.22 * reveal

    if (gridRef.current) applyGridOpacity(gridRef.current, reveal)
  })

  return (
    <group ref={groupRef}>
      <mesh renderOrder={0}>
        <sphereGeometry args={[BLOCH_RADIUS * 0.18, 32, 32]} />
        <meshBasicMaterial
          ref={coreRef}
          color="#a0c8e4"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <mesh renderOrder={1}>
        <sphereGeometry args={[BLOCH_RADIUS * 0.92, 48, 48]} />
        <meshBasicMaterial
          ref={atmosphereRef}
          color="#5a8aaa"
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh renderOrder={2}>
        <sphereGeometry args={[BLOCH_RADIUS, 96, 96]} />
        <meshPhysicalMaterial
          ref={glassRef}
          color="#b4d0e4"
          transparent
          opacity={0}
          roughness={0.04}
          metalness={0.08}
          transmission={0.96}
          thickness={1.4}
          ior={1.52}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={0.55}
          attenuationColor="#6a96b4"
          attenuationDistance={3}
          reflectivity={0.35}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      <mesh renderOrder={3} scale={1.006}>
        <sphereGeometry args={[BLOCH_RADIUS, 72, 72]} />
        <primitive object={fresnelMaterial} attach="material" />
      </mesh>

      <group ref={gridRef} renderOrder={4}>
        <SphereGrid />
      </group>

      {qubit ? (
        <QubitArrow
          theta={qubit.theta}
          phi={qubit.phi}
          radius={BLOCH_RADIUS}
          measurementPulse={measurementPulse}
        />
      ) : null}

      {qubit ? <PhaseRing phase={phase} pulse={phasePulse} /> : null}

      {qubit && measurementPulse > 0.01 ? (
        <MeasurementParticles pulse={measurementPulse} />
      ) : null}
    </group>
  )
}

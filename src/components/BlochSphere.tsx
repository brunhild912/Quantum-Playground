import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { meditativeFloat } from '../lib/easing'
import { createFresnelMaterial } from '../lib/fresnelMaterial'
import { SPHERE_CENTER_Y } from '../lib/sceneConstants'

export const BLOCH_RADIUS = 1.12
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

function SphereGrid() {
  const equator = useMemo(
    () => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xz'),
    [],
  )
  const meridianX = useMemo(
    () => createCirclePoints(LINE_RADIUS, SEGMENTS, 'xy'),
    [],
  )
  const meridianY = useMemo(
    () => createCirclePoints(LINE_RADIUS, SEGMENTS, 'yz'),
    [],
  )
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

export default function BlochSphere() {
  const groupRef = useRef<THREE.Group>(null)
  const fresnelMaterial = useMemo(
    () => createFresnelMaterial(),
    [],
)

useFrame((state) => {
  const group = groupRef.current
  if (!group) return

  const t = state.clock.elapsedTime

  group.position.y =
      SPHERE_CENTER_Y + meditativeFloat(t, 0.07)

  group.rotation.y = t * 0.08
  group.rotation.x = Math.sin(t * 0.25) * 0.08
  group.rotation.z = Math.sin(t * 0.17) * 0.03
})

  return (
    <group ref={groupRef}>
      <mesh renderOrder={0}>
        <sphereGeometry args={[BLOCH_RADIUS * 0.18, 32, 32]} />
        <meshBasicMaterial
          
          color="#a0c8e4"
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>

      <mesh renderOrder={1}>
        <sphereGeometry args={[BLOCH_RADIUS * 0.92, 48, 48]} />
        <meshBasicMaterial
          
          color="#5a8aaa"
          transparent
          opacity={0.025}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh renderOrder={2}>
        <sphereGeometry args={[BLOCH_RADIUS, 96, 96]} />
        <meshPhysicalMaterial
          
          color="#b4d0e4"
          transparent
          opacity={0.2}
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

      <group renderOrder={4}>
        <SphereGrid />
      </group>
    </group>
  )
}

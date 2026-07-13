import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Keep in sync with BLOCH_RADIUS in BlochSphere.tsx */
const SPHERE_RADIUS = 1.12
const COUNT = 28
const COLOR = new THREE.Color('#8ee8ff')

type MeasurementParticlesProps = {
  /** 0 idle → 1 peak measurement pulse */
  pulse: number
}

/**
 * Subtle cyan motes that drift inward during a measurement.
 * Lives in BlochSphere local space so it tracks sphere motion.
 */
export default function MeasurementParticles({ pulse }: MeasurementParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const progressRef = useRef(0)
  const activeRef = useRef(false)

  const { positions, starts, targets } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const starts = new Float32Array(COUNT * 3)
    const targets = new Float32Array(COUNT * 3)

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const sinPhi = Math.sin(phi)
      const dirX = sinPhi * Math.cos(theta)
      const dirY = Math.cos(phi)
      const dirZ = sinPhi * Math.sin(theta)

      const startR = SPHERE_RADIUS * (1.35 + Math.random() * 0.55)
      const endR = SPHERE_RADIUS * (0.15 + Math.random() * 0.2)

      starts[i3] = dirX * startR
      starts[i3 + 1] = dirY * startR
      starts[i3 + 2] = dirZ * startR

      targets[i3] = dirX * endR
      targets[i3 + 1] = dirY * endR
      targets[i3 + 2] = dirZ * endR

      positions[i3] = starts[i3]
      positions[i3 + 1] = starts[i3 + 1]
      positions[i3 + 2] = starts[i3 + 2]
    }

    return { positions, starts, targets }
  }, [])

  useEffect(() => {
    if (pulse > 0.15 && !activeRef.current) {
      activeRef.current = true
      progressRef.current = 0
      for (let i = 0; i < COUNT * 3; i++) positions[i] = starts[i]
      const geo = pointsRef.current?.geometry
      const attr = geo?.getAttribute('position') as THREE.BufferAttribute | undefined
      if (attr) {
        attr.needsUpdate = true
      }
    }
    if (pulse < 0.02) {
      activeRef.current = false
      progressRef.current = 0
    }
  }, [pulse, positions, starts])

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return

    const mat = points.material as THREE.PointsMaterial
    if (pulse < 0.02) {
      mat.opacity = 0
      return
    }

    progressRef.current = Math.min(1, progressRef.current + delta * 1.35)
    const t = progressRef.current
    const ease = 1 - (1 - t) ** 2

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      positions[i3] = starts[i3] + (targets[i3] - starts[i3]) * ease
      positions[i3 + 1] =
        starts[i3 + 1] + (targets[i3 + 1] - starts[i3 + 1]) * ease
      positions[i3 + 2] =
        starts[i3 + 2] + (targets[i3 + 2] - starts[i3 + 2]) * ease
    }

    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
    mat.opacity = 0.55 * pulse * (1 - ease * 0.35)
  })

  return (
    <points ref={pointsRef} renderOrder={12}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={COLOR}
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

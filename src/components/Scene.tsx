import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { SPHERE_CENTER_Y } from '../lib/sceneConstants'
import { DUAL_QUBIT_OFFSET_X } from '../lib/qubitId'
import { easeInOutCubic } from '../lib/easing'
import BlochSphere from './BlochSphere'
import SceneEffects from './SceneEffects'
import SpaceBackdrop from './SpaceBackdrop'
import StarField from './StarField'
import { useJourney, type JourneyPhase } from '../state/journeyContext'

const BASE_CAMERA: [number, number, number] = [0, 0.1, 6.4]
const FOCUS_CAMERA: [number, number, number] = [0, 0.08, 4.45]
const DUAL_CAMERA: [number, number, number] = [0, 0.08, 7.35]
const TRANSITION_MS = 2600

export type SceneQubitView = {
  id: string
  label: string
  theta: number
  phi: number
  measurementPulse?: number
  phase?: number
  phasePulse?: number
}

function CameraDrift({
  controlsRef,
  interacting,
  enabled,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  interacting: React.RefObject<boolean>
  enabled: boolean
}) {
  const { camera } = useThree()
  const driftOffset = useRef(new THREE.Vector3())

  useFrame((state) => {
    if (!enabled) return
    camera.position.sub(driftOffset.current)

    if (interacting.current) {
      driftOffset.current.set(0, 0, 0)
      camera.position.add(driftOffset.current)
      return
    }

    const t = state.clock.elapsedTime
    driftOffset.current.set(
      Math.sin(t * 0.07) * 0.015,
      Math.cos(t * 0.05) * 0.01,
      Math.sin(t * 0.04) * 0.008,
    )

    camera.position.add(driftOffset.current)

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(0, SPHERE_CENTER_Y, 0)
    }
  }, 2)

  return null
}

function SceneControls({
  controlsRef,
  enabled,
  dual,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  enabled: boolean
  dual: boolean
}) {
  const interacting = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const onStart = () => {
      interacting.current = true
    }
    const onEnd = () => {
      interacting.current = false
    }

    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)

    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controlsRef])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={enabled}
        enableDamping
        dampingFactor={0.08}
        minDistance={dual ? 5.2 : 3.8}
        maxDistance={11}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
        rotateSpeed={0.35}
        zoomSpeed={0.45}
        enablePan={false}
        target={[0, SPHERE_CENTER_Y, 0]}
      />
      <CameraDrift
        controlsRef={controlsRef}
        interacting={interacting}
        enabled={enabled}
      />
    </>
  )
}

function TransitionRig({
  phase,
  controlsRef,
  dual,
}: {
  phase: JourneyPhase
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  dual: boolean
}) {
  const { camera } = useThree()
  const { transitionStartMsRef, enterPlayground } = useJourney()
  const startPos = useRef(new THREE.Vector3(...BASE_CAMERA))
  const startQuat = useRef(new THREE.Quaternion())

  const focusPos = useMemo(
    () => new THREE.Vector3(...(dual ? DUAL_CAMERA : FOCUS_CAMERA)),
    [dual],
  )

  useEffect(() => {
    if (phase !== 'transition') return
    startPos.current.copy(camera.position)
    startQuat.current.copy(camera.quaternion)
  }, [phase, camera])

  useFrame(() => {
    if (phase !== 'transition') return
    const startMs = transitionStartMsRef.current
    if (startMs == null) return

    const tRaw = (performance.now() - startMs) / TRANSITION_MS
    const t = easeInOutCubic(Math.min(1, Math.max(0, tRaw)))

    camera.position.lerpVectors(startPos.current, focusPos, t)
    camera.lookAt(0, SPHERE_CENTER_Y, 0)

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(0, SPHERE_CENTER_Y, 0)
      controls.update()
    }

    if (tRaw >= 1) {
      enterPlayground()
    }
  }, 3)

  return null
}

/** Soft pull-back so both spheres fit once the playground opens. */
function DualFraming({ enabled }: { enabled: boolean }) {
  const { camera } = useThree()
  const done = useRef(false)

  useEffect(() => {
    done.current = false
  }, [enabled])

  useFrame(() => {
    if (!enabled || done.current) return
    const target = new THREE.Vector3(...DUAL_CAMERA)
    camera.position.lerp(target, 0.04)
    if (camera.position.distanceTo(target) < 0.02) {
      camera.position.copy(target)
      done.current = true
    }
  }, 2)

  return null
}

function EntanglementLink({
  a,
  b,
  active,
  boost = 0,
}: {
  a: { x: number; y: number }
  b: { x: number; y: number }
  active: boolean
  /** 0–1 brief intensify after Bell preparation. */
  boost?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const markerRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.LineBasicMaterial>(null)

  useFrame((state) => {
    const group = groupRef.current
    const marker = markerRef.current
    const mat = matRef.current
    if (!group || !marker || !mat) return

    const pulse = active ? 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3.2) : 0
    const boostAmt = Math.max(0, Math.min(1, boost))
    mat.opacity = active
      ? 0.24 + pulse * 0.18 + boostAmt * 0.28
      : 0

    const t = (state.clock.elapsedTime * 0.28) % 1
    marker.position.set(
      a.x + (b.x - a.x) * t,
      SPHERE_CENTER_Y + a.y + (b.y - a.y) * t,
      0,
    )
    marker.visible = active
    marker.scale.setScalar(1 + boostAmt * 0.55)
  })

  if (!active) return null

  return (
    <group ref={groupRef} renderOrder={7}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                a.x,
                SPHERE_CENTER_Y + a.y,
                0,
                b.x,
                SPHERE_CENTER_Y + b.y,
                0,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={matRef}
          color="#8ee8ff"
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial
          color="#c4b5fd"
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

export default function Scene({
  phase,
  qubit,
  measurementPulse = 0,
  phaseAngle = 0,
  phasePulse = 0,
  qubits,
  stackVertical = false,
  entangled = false,
  entanglementBoost = 0,
}: {
  phase: JourneyPhase
  /** Legacy single-qubit view (landing / transition). */
  qubit?: { theta: number; phi: number } | null
  measurementPulse?: number
  phaseAngle?: number
  phasePulse?: number
  /** Level 7A: two independent qubits in the playground. */
  qubits?: SceneQubitView[] | null
  /** Mobile: stack spheres vertically instead of side-by-side. */
  stackVertical?: boolean
  /** Level 7D: show a subtle quantum link between the two spheres. */
  entangled?: boolean
  /** Level 7E: brief intensify after Bell preparation (0–1). */
  entanglementBoost?: number
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const controlsEnabled = phase === 'playground' || phase === 'landing'
  const focus = phase === 'transition' ? 1 : 0
  const dual =
    phase === 'playground' && Array.isArray(qubits) && qubits.length >= 2

  const offsetA = stackVertical
    ? { x: 0, y: DUAL_QUBIT_OFFSET_X * 0.85 }
    : { x: -DUAL_QUBIT_OFFSET_X, y: 0 }
  const offsetB = stackVertical
    ? { x: 0, y: -DUAL_QUBIT_OFFSET_X * 0.85 }
    : { x: DUAL_QUBIT_OFFSET_X, y: 0 }

  return (
    <Canvas
      className="absolute inset-0 h-full w-full touch-none"
      camera={{ position: BASE_CAMERA, fov: 40, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <color attach="background" args={['#040a18']} />

      <SpaceBackdrop />

      <Environment preset="studio" environmentIntensity={10.0} />

      <hemisphereLight
        color="#c8d8ec"
        groundColor="#1a2838"
        intensity={1.35}
      />

      <ambientLight intensity={0.18} color="#b0c4dc" />

      <directionalLight
        position={[5, 8, 4]}
        intensity={0.65}
        color="#f0ebe4"
      />

      <directionalLight
        position={[-4, 2, -5]}
        intensity={0.18}
        color="#6888b0"
      />

      <spotLight
        position={[0, 1.5, -6]}
        intensity={0.45}
        color="#9ec0e0"
        angle={0.55}
        penumbra={1}
        distance={18}
        decay={20}
      />

      <pointLight
        position={[3, 2, 4]}
        intensity={0.2}
        color="#d8e8f4"
        distance={12}
      />

      <StarField />

      {dual ? (
        <>
          <BlochSphere
            focus={0}
            offsetX={offsetA.x}
            offsetY={offsetA.y}
            label={qubits![0]!.label}
            qubit={{ theta: qubits![0]!.theta, phi: qubits![0]!.phi }}
            measurementPulse={qubits![0]!.measurementPulse ?? 0}
            phase={qubits![0]!.phase ?? 0}
            phasePulse={qubits![0]!.phasePulse ?? 0}
          />
          <BlochSphere
            focus={0}
            offsetX={offsetB.x}
            offsetY={offsetB.y}
            label={qubits![1]!.label}
            qubit={{ theta: qubits![1]!.theta, phi: qubits![1]!.phi }}
            measurementPulse={qubits![1]!.measurementPulse ?? 0}
            phase={qubits![1]!.phase ?? 0}
            phasePulse={qubits![1]!.phasePulse ?? 0}
          />
          <EntanglementLink
            a={offsetA}
            b={offsetB}
            active={entangled}
            boost={entanglementBoost}
          />
          <DualFraming enabled />
        </>
      ) : (
        <BlochSphere
          focus={focus}
          qubit={qubit}
          measurementPulse={measurementPulse}
          phase={phaseAngle}
          phasePulse={phasePulse}
        />
      )}

      <SceneControls
        controlsRef={controlsRef}
        enabled={controlsEnabled}
        dual={dual}
      />
      <TransitionRig phase={phase} controlsRef={controlsRef} dual={dual} />
      <SceneEffects />
    </Canvas>
  )
}

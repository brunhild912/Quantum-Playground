import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { SPHERE_CENTER_Y } from '../lib/sceneConstants'
import { easeInOutCubic } from '../lib/easing'
import BlochSphere from './BlochSphere'
import SceneEffects from './SceneEffects'
import SpaceBackdrop from './SpaceBackdrop'
import StarField from './StarField'
import { useJourney, type JourneyPhase } from '../state/journeyContext'

const BASE_CAMERA: [number, number, number] = [0, 0.1, 6.4]
const FOCUS_CAMERA: [number, number, number] = [0, 0.08, 4.45]
const TRANSITION_MS = 2600

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
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  enabled: boolean
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
        minDistance={3.8}
        maxDistance={11}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
        rotateSpeed={0.35}
        zoomSpeed={0.45}
        enablePan={false}
        target={[0, SPHERE_CENTER_Y, 0]}
      />
      <CameraDrift controlsRef={controlsRef} interacting={interacting} enabled={enabled} />
    </>
  )
}

function TransitionRig({
  phase,
  controlsRef,
}: {
  phase: JourneyPhase
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera } = useThree()
  const { transitionStartMsRef, enterPlayground } = useJourney()
  const startPos = useRef(new THREE.Vector3(...BASE_CAMERA))
  const startQuat = useRef(new THREE.Quaternion())

  const focusPos = useMemo(() => new THREE.Vector3(...FOCUS_CAMERA), [])

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

export default function Scene({ phase }: { phase: JourneyPhase }) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const controlsEnabled = phase === 'playground' || phase === 'landing'
  const focus = phase === 'transition' ? 1 : 0

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
      <BlochSphere focus={focus} />
      <SceneControls controlsRef={controlsRef} enabled={controlsEnabled} />
      <TransitionRig phase={phase} controlsRef={controlsRef} />
      <SceneEffects />
    </Canvas>
  )
}

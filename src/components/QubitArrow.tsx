import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sphericalToDirection } from '../lib/spherical'

const ARROW_COLOR = 0xeaf7ff
const HEAD_COLOR = 0xffffff
const GLOW_COLOR = new THREE.Color('#8ee8ff')
const BASE_LINE = new THREE.Color(ARROW_COLOR)
const BASE_HEAD = new THREE.Color(HEAD_COLOR)
const UP = new THREE.Vector3(0, 1, 0)

type QubitArrowProps = {
  theta: number
  phi: number
  radius: number
  /** 0–1 measurement pulse for subtle glow + vibration */
  measurementPulse?: number
}

function orientArrow(arrow: THREE.ArrowHelper, direction: THREE.Vector3) {
  if (direction.lengthSq() < 1e-10) return

  const unit = direction.clone().normalize()

  if (unit.y > 0.99999) {
    arrow.quaternion.identity()
    return
  }

  if (unit.y < -0.99999) {
    arrow.quaternion.set(1, 0, 0, 0)
    return
  }

  arrow.quaternion.setFromUnitVectors(UP, unit)
}

export default function QubitArrow({
  theta,
  phi,
  radius,
  measurementPulse = 0,
}: QubitArrowProps) {
  const thetaRef = useRef(theta)
  const phiRef = useRef(phi)
  const pulseRef = useRef(measurementPulse)
  thetaRef.current = theta
  phiRef.current = phi
  pulseRef.current = measurementPulse

  const arrow = useMemo(() => {
    const helper = new THREE.ArrowHelper(
      UP,
      new THREE.Vector3(0, 0, 0),
      radius,
      ARROW_COLOR,
      radius * 0.15,
      radius * 0.1,
    )

    helper.line.material = new THREE.LineBasicMaterial({
      color: ARROW_COLOR,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    })

    helper.cone.material = new THREE.MeshBasicMaterial({
      color: HEAD_COLOR,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    })

    helper.renderOrder = 10
    return helper
  }, [radius])

  useFrame((state) => {
    const direction = sphericalToDirection(thetaRef.current, phiRef.current)
    const pulse = pulseRef.current

    orientArrow(arrow, direction)

    if (pulse > 0.01) {
      const t = state.clock.elapsedTime
      const amp = 0.014 * pulse
      arrow.position.set(
        Math.sin(t * 42) * amp,
        Math.cos(t * 37) * amp * 0.7,
        Math.sin(t * 29) * amp * 0.5,
      )
    } else {
      arrow.position.set(0, 0, 0)
    }

    const lineMat = arrow.line.material as THREE.LineBasicMaterial
    const coneMat = arrow.cone.material as THREE.MeshBasicMaterial
    lineMat.color.copy(BASE_LINE).lerp(GLOW_COLOR, pulse * 0.85)
    coneMat.color.copy(BASE_HEAD).lerp(GLOW_COLOR, pulse * 0.7)
    lineMat.opacity = 1
    coneMat.opacity = 1

    arrow.setLength(radius, radius * 0.15, radius * 0.1)
    arrow.updateMatrixWorld(true)
  })

  return <primitive object={arrow} />
}

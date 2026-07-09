import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sphericalToDirection } from '../lib/spherical'

const ARROW_COLOR = 0xeaf7ff
const HEAD_COLOR = 0xffffff
const UP = new THREE.Vector3(0, 1, 0)

type QubitArrowProps = {
  theta: number
  phi: number
  radius: number
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

export default function QubitArrow({ theta, phi, radius }: QubitArrowProps) {
  const thetaRef = useRef(theta)
  const phiRef = useRef(phi)
  thetaRef.current = theta
  phiRef.current = phi

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

  useFrame(() => {
    const direction = sphericalToDirection(thetaRef.current, phiRef.current)

    orientArrow(arrow, direction)
    arrow.setLength(radius, radius * 0.15, radius * 0.1)
    arrow.updateMatrixWorld(true)
  })

  return <primitive object={arrow} />
}

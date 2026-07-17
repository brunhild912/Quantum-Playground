import { sphericalComponents } from '../spherical'
import { cartesianToSpherical } from './xGate'

const INV_SQRT2 = 1 / Math.sqrt(2)

function rotateAboutHadamardAxis(
  x: number,
  y: number,
  z: number,
  angle: number,
): { x: number; y: number; z: number } {
  // In app coordinates, Hadamard is a π rotation about axis (X + Y) / √2.
  const ax = INV_SQRT2
  const ay = INV_SQRT2
  const az = 0
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const dot = ax * x + ay * y + az * z

  return {
    x: x * c + (ay * z - az * y) * s + ax * dot * (1 - c),
    y: y * c + (az * x - ax * z) * s + ay * dot * (1 - c),
    z: z * c + (ax * y - ay * x) * s + az * dot * (1 - c),
  }
}

/** Apply Hadamard: |0⟩ → |+⟩, |1⟩ → |−⟩. */
export function applyHGate(
  theta: number,
  phi: number,
): { theta: number; phi: number } {
  const { x, y, z } = sphericalComponents(theta, phi)
  const rotated = rotateAboutHadamardAxis(x, y, z, Math.PI)
  return cartesianToSpherical(rotated.x, rotated.y, rotated.z)
}

export function hGateRotationAt(
  theta: number,
  phi: number,
  angle: number,
): { theta: number; phi: number } {
  const { x, y, z } = sphericalComponents(theta, phi)
  const rotated = rotateAboutHadamardAxis(x, y, z, angle)
  return cartesianToSpherical(rotated.x, rotated.y, rotated.z)
}

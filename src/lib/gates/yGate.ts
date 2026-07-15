import { sphericalComponents } from '../spherical'
import { cartesianToSpherical } from './xGate'

/**
 * Rotate a Bloch vector by `angle` radians about the standard Bloch Y axis.
 * App convention: X = std X, Y = std Z, Z = std Y ⇒ rotate in the app XY plane.
 */
export function rotateAboutYAxis(
  x: number,
  y: number,
  z: number,
  angle: number,
): { x: number; y: number; z: number } {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: x * c + y * s,
    y: -x * s + y * c,
    z,
  }
}

/**
 * Apply the Pauli-Y gate: π rotation about the Bloch Y axis.
 * Transforms every state continuously (probability and phase together).
 */
export function applyYGate(
  theta: number,
  phi: number,
): { theta: number; phi: number } {
  const { x, y, z } = sphericalComponents(theta, phi)
  const rotated = rotateAboutYAxis(x, y, z, Math.PI)
  return cartesianToSpherical(rotated.x, rotated.y, rotated.z)
}

/**
 * Intermediate state while animating a Y rotation by `angle` (0 → π).
 */
export function yGateRotationAt(
  theta: number,
  phi: number,
  angle: number,
): { theta: number; phi: number } {
  const { x, y, z } = sphericalComponents(theta, phi)
  const rotated = rotateAboutYAxis(x, y, z, angle)
  return cartesianToSpherical(rotated.x, rotated.y, rotated.z)
}

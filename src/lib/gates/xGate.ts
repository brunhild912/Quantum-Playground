import { sphericalComponents } from '../spherical'

/** Normalize φ into [0, 2π). */
export function normalizePhi(phi: number): number {
  const twoPi = Math.PI * 2
  let p = phi % twoPi
  if (p < 0) p += twoPi
  return p
}

/** Convert Bloch Cartesian (app convention) back to (θ, φ). */
export function cartesianToSpherical(
  x: number,
  y: number,
  z: number,
): { theta: number; phi: number } {
  const len = Math.hypot(x, y, z)
  if (len < 1e-12) {
    return { theta: 0, phi: 0 }
  }
  const ny = y / len
  const theta = Math.acos(Math.min(1, Math.max(-1, ny)))
  const phi = normalizePhi(Math.atan2(z / len, x / len))
  return { theta, phi }
}

/** Rotate a Bloch vector by `angle` radians about the X axis. */
export function rotateAboutX(
  x: number,
  y: number,
  z: number,
  angle: number,
): { x: number; y: number; z: number } {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x,
    y: y * c - z * s,
    z: y * s + z * c,
  }
}

/**
 * Apply the Pauli-X (NOT) gate: π rotation about the Bloch X axis.
 * |0⟩ ↔ |1⟩; superpositions rotate continuously.
 */
export function applyXGate(
  theta: number,
  phi: number,
): { theta: number; phi: number } {
  const { x, y, z } = sphericalComponents(theta, phi)
  const rotated = rotateAboutX(x, y, z, Math.PI)
  return cartesianToSpherical(rotated.x, rotated.y, rotated.z)
}

/**
 * Intermediate state while animating an X rotation by `angle` (0 → π).
 */
export function xGateRotationAt(
  theta: number,
  phi: number,
  angle: number,
): { theta: number; phi: number } {
  const { x, y, z } = sphericalComponents(theta, phi)
  const rotated = rotateAboutX(x, y, z, angle)
  return cartesianToSpherical(rotated.x, rotated.y, rotated.z)
}

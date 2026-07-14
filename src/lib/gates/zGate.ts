import { normalizePhi } from './xGate'

/**
 * Apply the Pauli-Z (phase flip) gate: π rotation about the Bloch Z axis.
 * Latitude θ is unchanged; only azimuth φ advances by π.
 * Measurement probabilities P(|0⟩), P(|1⟩) are invariant.
 */
export function applyZGate(
  theta: number,
  phi: number,
): { theta: number; phi: number } {
  return {
    theta,
    phi: normalizePhi(phi + Math.PI),
  }
}

/**
 * Intermediate state while animating a Z rotation by `angle` (0 → π).
 */
export function zGateRotationAt(
  theta: number,
  phi: number,
  angle: number,
): { theta: number; phi: number } {
  return {
    theta,
    phi: normalizePhi(phi + angle),
  }
}

/** Relative phase angle on the Bloch Z axis (radians). */
export type PhaseRadians = number

export function normalizePhase(phase: number): number {
  const twoPi = Math.PI * 2
  let p = phase % twoPi
  if (p < 0) p += twoPi
  return p
}

/** Standard phase advances for common single-qubit phase gates. */
export const PHASE_GATE_DELTAS = {
  Z: Math.PI,
  S: Math.PI / 2,
  T: Math.PI / 4,
} as const

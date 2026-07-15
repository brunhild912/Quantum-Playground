import { PHASE_GATE_DELTAS } from '../phaseState'

/**
 * T / π/8 phase gate: |0⟩ → |0⟩, |1⟩ → e^(iπ/4)|1⟩.
 * Measurement probabilities are invariant; relative phase advances by π/4.
 *
 * Visualized exclusively via the shared phase layer (PHASE_GATE_DELTAS.T).
 */
export function tGatePhaseDelta(): number {
  return PHASE_GATE_DELTAS.T
}

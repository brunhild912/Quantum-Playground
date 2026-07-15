import { PHASE_GATE_DELTAS } from '../phaseState'

/**
 * Pauli-S / √Z phase gate: |0⟩ → |0⟩, |1⟩ → i|1⟩.
 * Measurement probabilities are invariant; relative phase advances by π/2.
 *
 * Visualized exclusively via the shared phase layer (PHASE_GATE_DELTAS.S).
 */
export function sGatePhaseDelta(): number {
  return PHASE_GATE_DELTAS.S
}

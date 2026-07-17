import type { QubitId } from './qubitId'

/** The four Bell states (maximally entangled two-qubit basis). */
export type BellStateId = 'phi+' | 'phi-' | 'psi+' | 'psi-'

export type BellGateOp =
  | { type: 'H'; qubit: QubitId }
  | { type: 'X'; qubit: QubitId }
  | { type: 'Z'; qubit: QubitId }
  | { type: 'CNOT'; control: QubitId; target: QubitId }

export type BellStateDefinition = {
  id: BellStateId
  /** Display label with proper superscripts, e.g. Φ⁺ */
  label: string
  /** Gate sequence after reset to |00⟩. */
  operations: BellGateOp[]
}

export const BELL_STATES: BellStateDefinition[] = [
  {
    id: 'phi+',
    label: 'Φ⁺',
    operations: [
      { type: 'H', qubit: 'A' },
      { type: 'CNOT', control: 'A', target: 'B' },
    ],
  },
  {
    id: 'phi-',
    label: 'Φ⁻',
    operations: [
      { type: 'H', qubit: 'A' },
      { type: 'Z', qubit: 'A' },
      { type: 'CNOT', control: 'A', target: 'B' },
    ],
  },
  {
    id: 'psi+',
    label: 'Ψ⁺',
    operations: [
      { type: 'H', qubit: 'A' },
      { type: 'CNOT', control: 'A', target: 'B' },
      { type: 'X', qubit: 'B' },
    ],
  },
  {
    id: 'psi-',
    label: 'Ψ⁻',
    operations: [
      { type: 'H', qubit: 'A' },
      { type: 'CNOT', control: 'A', target: 'B' },
      { type: 'X', qubit: 'B' },
      { type: 'Z', qubit: 'B' },
    ],
  },
]

export function getBellState(id: BellStateId): BellStateDefinition {
  return BELL_STATES.find((b) => b.id === id)!
}

/** Human-readable operation list for Observation Log. */
export function formatBellOperations(ops: BellGateOp[]): string[] {
  return ops.map((op) => {
    if (op.type === 'CNOT') {
      return `CNOT(${op.control}→${op.target})`
    }
    return `${op.type}(${op.qubit})`
  })
}

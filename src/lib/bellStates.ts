import type { QubitId } from './qubitId'
import {
  applyCNOTToAmplitudes,
  applySingleQubitGateToAmplitudes,
  tensorProductAmplitudes,
  type TwoQubitAmplitudes,
} from './twoQubitState'
import { applyHGate } from './gates/hGate'
import { applyZGate } from './gates/zGate'
import { applyXGate } from './gates/xGate'

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

/**
 * Build a Bell state by applying the same gate sequence used in preparation.
 * Does not hardcode amplitude vectors — reuses gate ops on |00⟩.
 */
export function buildBellAmplitudes(id: BellStateId): TwoQubitAmplitudes {
  const def = getBellState(id)
  let thetaA = 0
  let phiA = 0
  let thetaB = 0
  let phiB = 0
  let amps: TwoQubitAmplitudes | null = null

  for (const op of def.operations) {
    if (op.type === 'H') {
      if (op.qubit === 'A') {
        const next = applyHGate(thetaA, phiA)
        thetaA = next.theta
        phiA = next.phi
      } else {
        const next = applyHGate(thetaB, phiB)
        thetaB = next.theta
        phiB = next.phi
      }
    } else if (op.type === 'Z') {
      if (amps) {
        amps = applySingleQubitGateToAmplitudes(amps, 'Z', op.qubit)
      } else if (op.qubit === 'A') {
        const next = applyZGate(thetaA, phiA)
        thetaA = next.theta
        phiA = next.phi
      } else {
        const next = applyZGate(thetaB, phiB)
        thetaB = next.theta
        phiB = next.phi
      }
    } else if (op.type === 'X') {
      if (amps) {
        amps = applySingleQubitGateToAmplitudes(amps, 'X', op.qubit)
      } else if (op.qubit === 'A') {
        const next = applyXGate(thetaA, phiA)
        thetaA = next.theta
        phiA = next.phi
      } else {
        const next = applyXGate(thetaB, phiB)
        thetaB = next.theta
        phiB = next.phi
      }
    } else if (op.type === 'CNOT') {
      const before =
        amps ?? tensorProductAmplitudes(thetaA, phiA, thetaB, phiB)
      amps = applyCNOTToAmplitudes(before, op.control, op.target)
    }
  }

  return amps ?? tensorProductAmplitudes(thetaA, phiA, thetaB, phiB)
}

/** Discovery hints keyed by Bell family (agree vs disagree). */
export function bellCorrelationDiscovery(id: BellStateId): string[] {
  if (id === 'phi+' || id === 'phi-') {
    return [
      'Notice anything?',
      'The outcomes are random, but both qubits always agree.',
    ]
  }
  return [
    'The outcomes are still random, yet the qubits always disagree.',
  ]
}

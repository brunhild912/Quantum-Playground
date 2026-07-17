import { measurementProbabilities } from './qubitProbability'

/** Two-qubit computational basis labels (qubit A, then qubit B). */
export type TwoQubitBasis = '00' | '01' | '10' | '11'

export type JointBasisProbability = {
  basis: TwoQubitBasis
  ket: `|${TwoQubitBasis}⟩`
  /** Exact joint probability in [0, 1]. */
  probability: number
  /** Display percent; all four always sum to 100. */
  percent: number
}

/**
 * Abstraction for the combined two-qubit system.
 * Level 7B uses an independent (product) factorization.
 * Future milestones can swap `kind: 'vector'` without changing the panel UI.
 */
export type CompositeQuantumState =
  | {
      kind: 'independent'
      entries: JointBasisProbability[]
    }
  | {
      kind: 'vector'
      /** Reserved for entangled / full 4-amp state vectors. */
      amplitudes?: unknown
      entries: JointBasisProbability[]
    }

function roundPercentsTo100(raw: number[]): number[] {
  const floors = raw.map((p) => Math.floor(p * 100))
  let remainder = 100 - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((p, i) => ({ i, frac: p * 100 - floors[i]! }))
    .sort((a, b) => b.frac - a.frac)

  const out = [...floors]
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k]!.i]! += 1
    remainder -= 1
  }
  return out
}

/**
 * Joint probabilities for two independent qubits (product rule).
 * P(|ab⟩) = P_A(|a⟩) × P_B(|b⟩)
 */
export function compositeFromIndependentQubits(
  thetaA: number,
  thetaB: number,
): CompositeQuantumState {
  const a = measurementProbabilities(thetaA)
  const b = measurementProbabilities(thetaB)

  const bases: TwoQubitBasis[] = ['00', '01', '10', '11']
  const probs = [
    a.p0 * b.p0,
    a.p0 * b.p1,
    a.p1 * b.p0,
    a.p1 * b.p1,
  ]
  const percents = roundPercentsTo100(probs)

  return {
    kind: 'independent',
    entries: bases.map((basis, i) => ({
      basis,
      ket: `|${basis}⟩`,
      probability: probs[i]!,
      percent: percents[i]!,
    })),
  }
}

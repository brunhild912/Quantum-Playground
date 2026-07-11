export type QubitStateName = '|0⟩' | '|1⟩' | 'Superposition'

/** Must be this close to a pole to enter |0⟩ / |1⟩ from Superposition. */
const ENTER_POLE = 0.05
/** Must be this far from a pole to leave |0⟩ / |1⟩ into Superposition. */
const EXIT_POLE = 0.12

function distanceToOne(theta: number): number {
  return Math.abs(theta - Math.PI)
}

function classifyInitial(theta: number): QubitStateName {
  const mid = (ENTER_POLE + EXIT_POLE) / 2
  if (theta < mid) return '|0⟩'
  if (distanceToOne(theta) < mid) return '|1⟩'
  return 'Superposition'
}

/**
 * Classifies Bloch θ into a discrete state label.
 * Pass the previous label to apply hysteresis so float/slider noise
 * at the pole boundaries cannot flicker the displayed state.
 */
export function qubitStateLabel(
  theta: number,
  previous?: QubitStateName,
): QubitStateName {
  if (previous === undefined) {
    return classifyInitial(theta)
  }

  if (previous === '|0⟩') {
    return theta > EXIT_POLE ? 'Superposition' : '|0⟩'
  }

  if (previous === '|1⟩') {
    return distanceToOne(theta) > EXIT_POLE ? 'Superposition' : '|1⟩'
  }

  if (theta < ENTER_POLE) return '|0⟩'
  if (distanceToOne(theta) < ENTER_POLE) return '|1⟩'
  return 'Superposition'
}

export function qubitStateExplanation(
  theta: number,
  previous?: QubitStateName,
): string {
  const state = qubitStateLabel(theta, previous)
  if (state === '|0⟩') {
    return 'The qubit is pointing near the North Pole.'
  }
  if (state === '|1⟩') {
    return 'The qubit is pointing near the South Pole.'
  }
  return 'The qubit currently lies between the classical states.'
}

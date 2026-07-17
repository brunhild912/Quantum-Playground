export type QubitStateName = '|0⟩' | '|1⟩' | 'Superposition'

/** Shared pole band for discrete state classification. */
export const STATE_EPSILON = 0.08

/**
 * Single source of truth for |0⟩ / Superposition / |1⟩ classification.
 */
export function qubitStateLabel(theta: number): QubitStateName {
  let returned: QubitStateName

  if (theta < STATE_EPSILON) {
    returned = '|0⟩'
  } else if (Math.abs(theta - Math.PI) < STATE_EPSILON) {
    returned = '|1⟩'
  } else {
    returned = 'Superposition'
  }

  return returned
}

export function qubitStateExplanation(theta: number): string {
  const state = qubitStateLabel(theta)
  if (state === '|0⟩') {
    return 'The qubit is pointing near the North Pole.'
  }
  if (state === '|1⟩') {
    return 'The qubit is pointing near the South Pole.'
  }
  return 'The qubit currently lies between the classical states.'
}

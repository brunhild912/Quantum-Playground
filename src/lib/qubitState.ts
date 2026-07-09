const STATE_EPSILON = 0.08

export function qubitStateLabel(theta: number): string {
  if (theta < STATE_EPSILON) return '|0⟩'
  if (Math.abs(theta - Math.PI) < STATE_EPSILON) return '|1⟩'
  return 'Superposition'
}

export function qubitStateExplanation(theta: number): string {
  if (theta < STATE_EPSILON) {
    return 'The qubit is pointing near the North Pole.'
  }
  if (Math.abs(theta - Math.PI) < STATE_EPSILON) {
    return 'The qubit is pointing near the South Pole.'
  }
  return 'The qubit currently lies between the classical states.'
}

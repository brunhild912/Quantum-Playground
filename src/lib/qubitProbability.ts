/**
 * Bloch-sphere measurement probabilities for a pure qubit state.
 * P(|0⟩) = cos²(θ/2), P(|1⟩) = sin²(θ/2)
 */
export type MeasurementProbabilities = {
  p0: number
  p1: number
  /** Rounded display percents that always sum to 100. */
  percent0: number
  percent1: number
}

export function measurementProbabilities(theta: number): MeasurementProbabilities {
  const half = theta / 2
  const p0 = Math.cos(half) ** 2
  const p1 = Math.sin(half) ** 2
  const percent0 = Math.round(p0 * 100)
  const percent1 = 100 - percent0

  return { p0, p1, percent0, percent1 }
}

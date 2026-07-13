import {
  measurementProbabilities,
  type MeasurementProbabilities,
} from './qubitProbability'

export type MeasurementOutcome = '|0⟩' | '|1⟩'

export type MeasurementSample = {
  outcome: MeasurementOutcome
  collapsedTheta: number
  probabilities: MeasurementProbabilities
}

/**
 * Samples a Z-basis measurement for the current Bloch θ.
 * Uses P(|0⟩)=cos²(θ/2); collapses to θ=0 or θ=π.
 */
export function sampleMeasurement(
  theta: number,
  random: () => number = Math.random,
): MeasurementSample {
  const probabilities = measurementProbabilities(theta)
  const outcome: MeasurementOutcome =
    random() < probabilities.p0 ? '|0⟩' : '|1⟩'

  return {
    outcome,
    collapsedTheta: outcome === '|0⟩' ? 0 : Math.PI,
    probabilities,
  }
}

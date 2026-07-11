import { qubitStateLabel, type QubitStateName } from './qubitState'

function formatTheta(theta: number): string {
  const deg = Math.round((theta * 180) / Math.PI)
  return `θ = ${theta.toFixed(2)} rad (${deg}°)`
}

function formatPhi(phi: number): string {
  const deg = Math.round((phi * 180) / Math.PI)
  return `φ = ${phi.toFixed(2)} rad (${deg}°)`
}

export function discoveryReadout(
  theta: number,
  phi: number,
  previous?: QubitStateName,
): string[] {
  const state = qubitStateLabel(theta, previous)

  switch (state) {
    case '|0⟩':
      return [
        formatTheta(theta),
        'You are at the north pole.',
        'This corresponds to the |0⟩ state.',
      ]

    case '|1⟩':
      return [
        formatTheta(theta),
        'You reached the south pole.',
        'This corresponds to the |1⟩ state.',
      ]

    default:
      return [
        'Notice something different.',
        formatTheta(theta),
        formatPhi(phi),
        "Unlike a classical bit, your qubit isn't limited to only two positions.",
        'It can exist in any direction on the Bloch Sphere.',
        'That continuous space represents superposition.',
      ]
  }
}
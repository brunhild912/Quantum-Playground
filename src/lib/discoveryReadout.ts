const STATE_EPSILON = 0.08

function formatTheta(theta: number): string {
  const deg = Math.round((theta * 180) / Math.PI)
  return `θ = ${theta.toFixed(2)} rad (${deg}°)`
}

function formatPhi(phi: number): string {
  const deg = Math.round((phi * 180) / Math.PI)
  return `φ = ${phi.toFixed(2)} rad (${deg}°)`
}

export function discoveryReadout(theta: number, phi: number): string[] {
  if (theta < STATE_EPSILON) {
    return [
      formatTheta(theta),
      'You are at the north pole.',
      'This corresponds to the |0⟩ state.',
    ]
  }

  if (Math.abs(theta - Math.PI) < STATE_EPSILON) {
    return [
      formatTheta(theta),
      'You reached the south pole.',
      'This is the |1⟩ state.',
    ]
  }

  return [
    'Notice something different.',
    formatTheta(theta),
    formatPhi(phi),
    "Unlike a classical bit, your qubit isn't limited to only two positions.",
    'It can exist in any direction on the Bloch Sphere.',
    'That continuous space represents superposition.',
  ]
}

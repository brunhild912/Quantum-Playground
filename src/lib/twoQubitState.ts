import {
  cFromPolar,
  cMag2,
  cMul,
  cAlmostEqual,
  complex,
  type Complex,
} from './complex'
import { cartesianToSpherical } from './gates/xGate'
import type { QubitId } from './qubitId'
import {
  type CompositeQuantumState,
  type TwoQubitBasis,
} from './compositeQuantumState'

/** Amplitudes in order |00⟩, |01⟩, |10⟩, |11⟩ (A then B). */
export type TwoQubitAmplitudes = [Complex, Complex, Complex, Complex]

const BASES: TwoQubitBasis[] = ['00', '01', '10', '11']

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

/** Single-qubit amplitudes α|0⟩ + β|1⟩ from Bloch angles. */
export function qubitAmplitudes(
  theta: number,
  phi: number,
): { alpha: Complex; beta: Complex } {
  const half = theta / 2
  return {
    alpha: complex(Math.cos(half)),
    beta: cFromPolar(Math.sin(half), phi),
  }
}

/** Tensor product |A⟩ ⊗ |B⟩ → 4 amplitudes. */
export function tensorProductAmplitudes(
  thetaA: number,
  phiA: number,
  thetaB: number,
  phiB: number,
): TwoQubitAmplitudes {
  const a = qubitAmplitudes(thetaA, phiA)
  const b = qubitAmplitudes(thetaB, phiB)
  return [
    cMul(a.alpha, b.alpha),
    cMul(a.alpha, b.beta),
    cMul(a.beta, b.alpha),
    cMul(a.beta, b.beta),
  ]
}

/**
 * Controlled-NOT on the joint state vector.
 * Control = |1⟩ subspace → X on target (swap the paired basis states).
 */
export function applyCNOTToAmplitudes(
  amps: TwoQubitAmplitudes,
  control: QubitId,
  target: QubitId,
): TwoQubitAmplitudes {
  if (control === target) return [...amps] as TwoQubitAmplitudes

  const next: TwoQubitAmplitudes = [amps[0], amps[1], amps[2], amps[3]]

  if (control === 'A' && target === 'B') {
    // |10⟩ ↔ |11⟩
    next[2] = amps[3]
    next[3] = amps[2]
  } else if (control === 'B' && target === 'A') {
    // |01⟩ ↔ |11⟩
    next[1] = amps[3]
    next[3] = amps[1]
  }

  return next
}

export function amplitudesNearlyEqual(
  a: TwoQubitAmplitudes,
  b: TwoQubitAmplitudes,
  eps = 1e-8,
): boolean {
  return (
    cAlmostEqual(a[0], b[0], eps) &&
    cAlmostEqual(a[1], b[1], eps) &&
    cAlmostEqual(a[2], b[2], eps) &&
    cAlmostEqual(a[3], b[3], eps)
  )
}

export function jointProbabilitiesFromAmplitudes(
  amps: TwoQubitAmplitudes,
): number[] {
  return amps.map((c) => cMag2(c))
}

export function compositeFromAmplitudes(
  amps: TwoQubitAmplitudes,
): CompositeQuantumState {
  const probs = jointProbabilitiesFromAmplitudes(amps)
  const percents = roundPercentsTo100(probs)
  return {
    kind: 'vector',
    amplitudes: amps,
    entries: BASES.map((basis, i) => ({
      basis,
      ket: `|${basis}⟩`,
      probability: probs[i]!,
      percent: percents[i]!,
    })),
  }
}

/** P(control = |1⟩) from the joint state. */
export function controlOneProbability(
  amps: TwoQubitAmplitudes,
  control: QubitId,
): number {
  if (control === 'A') return cMag2(amps[2]) + cMag2(amps[3])
  return cMag2(amps[1]) + cMag2(amps[3])
}

/**
 * Reduced Bloch vector for one qubit (app coords: Y = computational axis).
 * Returns unit direction when pure; near-zero when maximally mixed.
 */
export function reducedBlochVector(
  amps: TwoQubitAmplitudes,
  qubit: QubitId,
): { x: number; y: number; z: number; length: number; theta: number; phi: number } {
  // Density matrix elements via partial trace.
  // Ordering |00>,|01>,|10>,|11>
  const a00 = amps[0]
  const a01 = amps[1]
  const a10 = amps[2]
  const a11 = amps[3]

  let rho00: number
  let rho11: number
  let rho01: Complex

  if (qubit === 'A') {
    // Trace out B
    rho00 = cMag2(a00) + cMag2(a01)
    rho11 = cMag2(a10) + cMag2(a11)
    rho01 = {
      re: a00.re * a10.re + a00.im * a10.im + a01.re * a11.re + a01.im * a11.im,
      im: a00.re * a10.im - a00.im * a10.re + a01.re * a11.im - a01.im * a11.re,
    }
  } else {
    // Trace out A
    rho00 = cMag2(a00) + cMag2(a10)
    rho11 = cMag2(a01) + cMag2(a11)
    rho01 = {
      re: a00.re * a01.re + a00.im * a01.im + a10.re * a11.re + a10.im * a11.im,
      im: a00.re * a01.im - a00.im * a01.re + a10.re * a11.im - a10.im * a11.re,
    }
  }

  // Bloch (std): x = 2 Re ρ01, y = 2 Im ρ01, z = ρ00 - ρ11
  // App coords: X=stdX, Y=stdZ, Z=stdY
  const stdX = 2 * rho01.re
  const stdY = 2 * rho01.im
  const stdZ = rho00 - rho11
  const x = stdX
  const y = stdZ
  const z = stdY
  const length = Math.hypot(x, y, z)
  const { theta, phi } = cartesianToSpherical(x, y, z)
  return { x, y, z, length, theta, phi }
}

export function isApproximatelyEntangled(
  amps: TwoQubitAmplitudes,
  eps = 1e-6,
): boolean {
  // Product test: a00*a11 ≈ a01*a10
  const left = cMul(amps[0], amps[3])
  const right = cMul(amps[1], amps[2])
  return !cAlmostEqual(left, right, eps)
}

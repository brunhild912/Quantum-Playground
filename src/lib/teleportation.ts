import {
  cAdd,
  cMag2,
  cMul,
  cScale,
  complex,
  type Complex,
} from './complex'
import { cartesianToSpherical } from './gates/xGate'
import {
  qubitAmplitudes,
  type TwoQubitAmplitudes,
} from './twoQubitState'

/** |q0 q1 q2⟩ amplitudes, index = 4·q0 + 2·q1 + q2. */
export type ThreeQubitAmplitudes = [
  Complex,
  Complex,
  Complex,
  Complex,
  Complex,
  Complex,
  Complex,
  Complex,
]

export type TeleportCorrection = 'I' | 'X' | 'Z' | 'XZ'

export type TeleportProtocolResult = {
  source: { theta: number; phi: number }
  classicalBits: string
  correction: TeleportCorrection
  bobFinal: { theta: number; phi: number }
  aliceAfterMeasure: { theta: number; phi: number }
}

const INV_SQRT2 = 1 / Math.sqrt(2)
const GATE_H: readonly [Complex, Complex, Complex, Complex] = [
  complex(INV_SQRT2),
  complex(INV_SQRT2),
  complex(INV_SQRT2),
  complex(-INV_SQRT2),
]
const GATE_X: readonly [Complex, Complex, Complex, Complex] = [
  complex(0),
  complex(1),
  complex(1),
  complex(0),
]
const GATE_Z: readonly [Complex, Complex, Complex, Complex] = [
  complex(1),
  complex(0),
  complex(0),
  complex(-1),
]

function idx(q0: 0 | 1, q1: 0 | 1, q2: 0 | 1): number {
  return 4 * q0 + 2 * q1 + q2
}

function tensor3(
  a: { alpha: Complex; beta: Complex },
  b: { alpha: Complex; beta: Complex },
  c: { alpha: Complex; beta: Complex },
): ThreeQubitAmplitudes {
  const out: Complex[] = Array.from({ length: 8 }, () => complex(0))
  const singles = [a, b, c]
  for (let q0 = 0; q0 < 2; q0++) {
    for (let q1 = 0; q1 < 2; q1++) {
      for (let q2 = 0; q2 < 2; q2++) {
        const amp = cMul(
          cMul(
            singles[0]![q0 === 0 ? 'alpha' : 'beta'],
            singles[1]![q1 === 0 ? 'alpha' : 'beta'],
          ),
          singles[2]![q2 === 0 ? 'alpha' : 'beta'],
        )
        out[idx(q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1)] = amp
      }
    }
  }
  return out as ThreeQubitAmplitudes
}

function apply2x2OnQubit(
  amps: ThreeQubitAmplitudes,
  qubit: 0 | 1 | 2,
  g: readonly [Complex, Complex, Complex, Complex],
): ThreeQubitAmplitudes {
  const [g00, g01, g10, g11] = g
  const out: Complex[] = Array.from({ length: 8 }, () => complex(0))
  for (let q0 = 0; q0 < 2; q0++) {
    for (let q1 = 0; q1 < 2; q1++) {
      for (let q2 = 0; q2 < 2; q2++) {
        const bits: [0 | 1, 0 | 1, 0 | 1] = [q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1]
        const t = bits[qubit]!
        const other0: [0 | 1, 0 | 1, 0 | 1] = [...bits] as [0 | 1, 0 | 1, 0 | 1]
        other0[qubit] = 0
        const other1: [0 | 1, 0 | 1, 0 | 1] = [...bits] as [0 | 1, 0 | 1, 0 | 1]
        other1[qubit] = 1
        const a0 = amps[idx(...other0)]
        const a1 = amps[idx(...other1)]
        out[idx(...bits)] =
          t === 0
            ? cAdd(cMul(g00, a0), cMul(g01, a1))
            : cAdd(cMul(g10, a0), cMul(g11, a1))
      }
    }
  }
  return out as ThreeQubitAmplitudes
}

function applyCNOT3(
  amps: ThreeQubitAmplitudes,
  control: 0 | 1 | 2,
  target: 0 | 1 | 2,
): ThreeQubitAmplitudes {
  if (control === target) return [...amps] as ThreeQubitAmplitudes
  const next = [...amps] as ThreeQubitAmplitudes
  for (let q0 = 0; q0 < 2; q0++) {
    for (let q1 = 0; q1 < 2; q1++) {
      for (let q2 = 0; q2 < 2; q2++) {
        const bits: [0 | 1, 0 | 1, 0 | 1] = [q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1]
        if (bits[control] === 1) {
          const flipped: [0 | 1, 0 | 1, 0 | 1] = [...bits] as [0 | 1, 0 | 1, 0 | 1]
          flipped[target] = (flipped[target]! === 0 ? 1 : 0) as 0 | 1
          next[idx(...bits)] = amps[idx(...flipped)]
        } else {
          next[idx(...bits)] = amps[idx(...bits)]
        }
      }
    }
  }
  return next
}

export function reducedBloch3(
  amps: ThreeQubitAmplitudes,
  qubit: 0 | 1 | 2,
): { theta: number; phi: number; length: number } {
  let rho00 = 0
  let rho11 = 0
  let rho01re = 0
  let rho01im = 0

  for (let q0 = 0; q0 < 2; q0++) {
    for (let q1 = 0; q1 < 2; q1++) {
      for (let q2 = 0; q2 < 2; q2++) {
        const bits: [0 | 1, 0 | 1, 0 | 1] = [q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1]
        const mag2 = cMag2(amps[idx(...bits)])
        if (bits[qubit] === 0) rho00 += mag2
        else rho11 += mag2
      }
    }
  }

  for (let q0 = 0; q0 < 2; q0++) {
    for (let q1 = 0; q1 < 2; q1++) {
      for (let q2 = 0; q2 < 2; q2++) {
        const b0: [0 | 1, 0 | 1, 0 | 1] = [q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1]
        b0[qubit] = 0
        const b1: [0 | 1, 0 | 1, 0 | 1] = [q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1]
        b1[qubit] = 1
        const a0 = amps[idx(...b0)]
        const a1 = amps[idx(...b1)]
        rho01re += a0.re * a1.re + a0.im * a1.im
        rho01im += a0.re * a1.im - a0.im * a1.re
      }
    }
  }

  const stdX = 2 * rho01re
  const stdY = 2 * rho01im
  const stdZ = rho00 - rho11
  const x = stdX
  const y = stdZ
  const z = stdY
  const length = Math.hypot(x, y, z)
  const { theta, phi } =
    length < 1e-8 ? { theta: Math.PI / 2, phi: 0 } : cartesianToSpherical(x, y, z)
  return { theta, phi, length }
}

function measureQubits01(
  amps: ThreeQubitAmplitudes,
  random: () => number,
): { m0: 0 | 1; m1: 0 | 1; collapsed: ThreeQubitAmplitudes } {
  const probs = [0, 0, 0, 0]
  for (let m0 = 0; m0 < 2; m0++) {
    for (let m1 = 0; m1 < 2; m1++) {
      let p = 0
      for (let q2 = 0; q2 < 2; q2++) {
        p += cMag2(
          amps[idx(m0 as 0 | 1, m1 as 0 | 1, q2 as 0 | 1)],
        )
      }
      probs[2 * m0 + m1] = p
    }
  }
  const r = random()
  let acc = 0
  let choice = 0
  for (let i = 0; i < 4; i++) {
    acc += probs[i]!
    if (r < acc) {
      choice = i
      break
    }
  }
  const m0 = (choice >= 2 ? 1 : 0) as 0 | 1
  const m1 = (choice % 2 === 1 ? 1 : 0) as 0 | 1

  const collapsed: Complex[] = Array.from({ length: 8 }, () => complex(0))
  let norm2 = 0
  for (let q2 = 0; q2 < 2; q2++) {
    const a = amps[idx(m0, m1, q2 as 0 | 1)]
    collapsed[idx(m0, m1, q2 as 0 | 1)] = a
    norm2 += cMag2(a)
  }
  const norm = Math.sqrt(norm2)
  for (let i = 0; i < 8; i++) {
    collapsed[i] = cScale(collapsed[i]!, norm > 1e-12 ? 1 / norm : 1)
  }

  return { m0, m1, collapsed: collapsed as ThreeQubitAmplitudes }
}

function correctionForBits(m0: 0 | 1, m1: 0 | 1): TeleportCorrection {
  if (m0 === 0 && m1 === 0) return 'I'
  if (m0 === 0 && m1 === 1) return 'X'
  if (m0 === 1 && m1 === 0) return 'Z'
  return 'XZ'
}

function applyCorrection3(
  amps: ThreeQubitAmplitudes,
  correction: TeleportCorrection,
): ThreeQubitAmplitudes {
  let next = amps
  // Bob applies X^{m1} Z^{m0} → Z first, then X when both are needed.
  if (correction === 'Z' || correction === 'XZ') {
    next = apply2x2OnQubit(next, 2, GATE_Z)
  }
  if (correction === 'X' || correction === 'XZ') {
    next = apply2x2OnQubit(next, 2, GATE_X)
  }
  return next
}

export function runTeleportationProtocol(
  aliceTheta: number,
  alicePhi: number,
  random: () => number = Math.random,
): TeleportProtocolResult {
  const source = { theta: aliceTheta, phi: alicePhi }
  const alice = qubitAmplitudes(aliceTheta, alicePhi)
  const zero = qubitAmplitudes(0, 0)

  let amps = tensor3(alice, zero, zero)

  amps = apply2x2OnQubit(amps, 1, GATE_H)
  amps = applyCNOT3(amps, 1, 2)
  amps = applyCNOT3(amps, 0, 1)
  amps = apply2x2OnQubit(amps, 0, GATE_H)

  const { m0, m1, collapsed } = measureQubits01(amps, random)
  const correction = correctionForBits(m0, m1)
  const corrected = applyCorrection3(collapsed, correction)

  const bob = reducedBloch3(corrected, 2)
  const aliceAfter = reducedBloch3(collapsed, 0)

  return {
    source,
    classicalBits: `${m0}${m1}`,
    correction,
    bobFinal: { theta: bob.theta, phi: bob.phi },
    aliceAfterMeasure: { theta: aliceAfter.theta, phi: aliceAfter.phi },
  }
}

export function lerpAngles(
  from: { theta: number; phi: number },
  to: { theta: number; phi: number },
  t: number,
): { theta: number; phi: number } {
  return {
    theta: from.theta + (to.theta - from.theta) * t,
    phi: from.phi + (to.phi - from.phi) * t,
  }
}

export function isPairBobEntangled(amps: ThreeQubitAmplitudes): boolean {
  let a00 = complex(0)
  let a01 = complex(0)
  let a10 = complex(0)
  let a11 = complex(0)
  for (let q0 = 0; q0 < 2; q0++) {
    for (let q1 = 0; q1 < 2; q1++) {
      for (let q2 = 0; q2 < 2; q2++) {
        const a = amps[idx(q0 as 0 | 1, q1 as 0 | 1, q2 as 0 | 1)]
        const j = 2 * q1 + q2
        if (j === 0) a00 = cAdd(a00, a)
        if (j === 1) a01 = cAdd(a01, a)
        if (j === 2) a10 = cAdd(a10, a)
        if (j === 3) a11 = cAdd(a11, a)
      }
    }
  }
  const left = cMul(a00, a11)
  const right = cMul(a01, a10)
  return Math.abs(left.re - right.re) > 1e-5 || Math.abs(left.im - right.im) > 1e-5
}

export function buildTeleportSnapshot(
  aliceTheta: number,
  alicePhi: number,
  stage: 'init' | 'h-pair' | 'cnot-pair' | 'pre-measure' | 'post-measure' | 'corrected',
  measureBits?: { m0: 0 | 1; m1: 0 | 1 },
  correction?: TeleportCorrection,
): ThreeQubitAmplitudes {
  const alice = qubitAmplitudes(aliceTheta, alicePhi)
  const zero = qubitAmplitudes(0, 0)
  let amps = tensor3(alice, zero, zero)

  if (stage === 'init') return amps

  amps = apply2x2OnQubit(amps, 1, GATE_H)
  if (stage === 'h-pair') return amps

  amps = applyCNOT3(amps, 1, 2)
  if (stage === 'cnot-pair') return amps

  amps = applyCNOT3(amps, 0, 1)
  amps = apply2x2OnQubit(amps, 0, GATE_H)
  if (stage === 'pre-measure') return amps

  if (measureBits) {
    const collapsed: Complex[] = Array.from({ length: 8 }, () => complex(0))
    let norm2 = 0
    for (let q2 = 0; q2 < 2; q2++) {
      const a = amps[idx(measureBits.m0, measureBits.m1, q2 as 0 | 1)]
      collapsed[idx(measureBits.m0, measureBits.m1, q2 as 0 | 1)] = a
      norm2 += cMag2(a)
    }
    const norm = Math.sqrt(norm2)
    for (let i = 0; i < 8; i++) {
      collapsed[i] = cScale(collapsed[i]!, norm > 1e-12 ? 1 / norm : 1)
    }
    amps = collapsed as ThreeQubitAmplitudes
  }

  if (stage === 'post-measure') return amps

  if (correction) {
    amps = applyCorrection3(amps, correction)
  }
  return amps
}

export function randomBlochState(random: () => number = Math.random): {
  theta: number
  phi: number
} {
  return {
    theta: Math.acos(1 - 2 * random()),
    phi: random() * Math.PI * 2,
  }
}

export function aliceSourceState(
  theta: number,
  phi: number,
  random: () => number = Math.random,
): { theta: number; phi: number } {
  if (theta < 0.12) return randomBlochState(random)
  return { theta, phi }
}

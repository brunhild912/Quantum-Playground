import type { QubitId } from '../qubitId'
import {
  applyCNOTToAmplitudes,
  amplitudesNearlyEqual,
  controlOneProbability,
  reducedBlochVector,
  isApproximatelyEntangled,
  tensorProductAmplitudes,
  type TwoQubitAmplitudes,
} from '../twoQubitState'
import { applyXGate } from './xGate'

export type CNOTSelection = {
  control: QubitId
  target: QubitId
}

export type CNOTApplyResult = {
  before: TwoQubitAmplitudes
  after: TwoQubitAmplitudes
  activated: boolean
  controlOneProb: number
  /** Target should play the X animation (separable flip). */
  animateTargetX: boolean
  targetBefore: { theta: number; phi: number }
  targetAfter: { theta: number; phi: number }
  qubitAAfter: { theta: number; phi: number }
  qubitBAfter: { theta: number; phi: number }
  discovery: string
  logResult: string
  entangled: boolean
}

/**
 * Build the joint state, apply CNOT, and derive display updates.
 * Reuses Pauli-X for the educational target-flip path when the state stays separable.
 */
export function runCNOT(
  thetaA: number,
  phiA: number,
  thetaB: number,
  phiB: number,
  selection: CNOTSelection,
  /** When the register is already a non-product state, pass it here. */
  existingAmps?: TwoQubitAmplitudes | null,
): CNOTApplyResult {
  const before =
    existingAmps ??
    tensorProductAmplitudes(thetaA, phiA, thetaB, phiB)

  const after = applyCNOTToAmplitudes(
    before,
    selection.control,
    selection.target,
  )

  const activated = !amplitudesNearlyEqual(before, after)
  const controlOneProb = controlOneProbability(before, selection.control)

  const aAfter = reducedBlochVector(after, 'A')
  const bAfter = reducedBlochVector(after, 'B')
  const entangled = isApproximatelyEntangled(after)

  const targetBefore =
    selection.target === 'A'
      ? { theta: thetaA, phi: phiA }
      : { theta: thetaB, phi: phiB }

  const targetAfterReduced =
    selection.target === 'A'
      ? { theta: aAfter.theta, phi: aAfter.phi }
      : { theta: bAfter.theta, phi: bAfter.phi }

  const expectedX = applyXGate(targetBefore.theta, targetBefore.phi)
  const matchesX =
    activated &&
    Math.abs(expectedX.theta - targetAfterReduced.theta) < 0.12 &&
    (Math.abs(expectedX.phi - targetAfterReduced.phi) < 0.12 ||
      Math.min(targetAfterReduced.theta, Math.PI - targetAfterReduced.theta) <
        0.08)

  let discovery: string
  let logResult: string
  if (!activated) {
    discovery = 'Control was |0⟩. Target remained unchanged.'
    logResult = 'No change (control = |0⟩).'
  } else if (controlOneProb > 0.85 && matchesX) {
    discovery = 'Control was |1⟩. Target flipped.'
    logResult = 'Target flipped.'
  } else if (entangled) {
    discovery = 'The two qubits are now entangled.'
    logResult = 'Qubits are now entangled.'
  } else {
    discovery = 'Control carried |1⟩ amplitude. Target was transformed.'
    logResult = 'Joint state updated (control |1⟩ subspace).'
  }

  return {
    before,
    after,
    activated,
    controlOneProb,
    animateTargetX: matchesX,
    targetBefore,
    targetAfter: matchesX ? expectedX : targetAfterReduced,
    qubitAAfter: { theta: aAfter.theta, phi: aAfter.phi },
    qubitBAfter: { theta: bAfter.theta, phi: bAfter.phi },
    discovery,
    logResult,
    entangled,
  }
}

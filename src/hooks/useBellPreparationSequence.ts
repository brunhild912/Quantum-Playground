import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatBellOperations,
  getBellState,
  type BellStateId,
} from '../lib/bellStates'
import { easeInOutCubic } from '../lib/easing'
import { applyZGate } from '../lib/gates/zGate'
import { xGateRotationAt } from '../lib/gates/xGate'
import {
  createBellPreparationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'
import type { CNOTSelection } from '../lib/gates/cnotGate'
import {
  applySingleQubitGateToAmplitudes,
  reducedBlochVector,
  type TwoQubitAmplitudes,
} from '../lib/twoQubitState'
import type { QubitId } from '../lib/qubitId'

const STEP_GAP_MS = 180
const JOINT_GATE_MS = 800
const READOUT_DISMISS_MS = 8000
const LINK_BOOST_MS = 900

export type BellPrepReadout = {
  title: string
  body: string[]
}

type UseBellPreparationSequenceArgs = {
  enabled: boolean
  applyH: (qubit: QubitId, options?: { silent?: boolean }) => void
  applyZ: (qubit: QubitId, options?: { silent?: boolean }) => void
  applyCNOT: (
    selection: CNOTSelection,
    options?: { silent?: boolean },
  ) => void
  isQubitBusy: (qubit: QubitId) => boolean
  isCnotBusy: () => boolean
  thetaA: number
  phiA: number
  thetaB: number
  phiB: number
  setAnglesA: (theta: number, phi: number) => void
  setAnglesB: (theta: number, phi: number) => void
  jointAmps: TwoQubitAmplitudes | null
  onJointAmps: (amps: TwoQubitAmplitudes) => void
  clearJointAmps: () => void
  onDiscovery: (message: string | string[]) => void
  /** Fired when a Bell state finishes preparing (Level 7F). */
  onPrepared?: (id: BellStateId) => void
  /** Brief strengthen of the quantum link when prep completes. */
  onLinkBoost?: () => void
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitWhile(
  predicate: () => boolean,
  timeoutMs = 12000,
): Promise<void> {
  const started = performance.now()
  while (predicate()) {
    if (performance.now() - started > timeoutMs) return
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

async function runUntilIdle(
  start: () => void,
  isBusy: () => boolean,
): Promise<void> {
  start()
  await sleep(40)
  // If the gate never started (blocked), bail quickly.
  const startedAt = performance.now()
  while (!isBusy() && performance.now() - startedAt < 400) {
    await sleep(20)
  }
  await waitWhile(isBusy)
}

/**
 * Level 7E — orchestrate Reset → gate sequence using existing animations.
 * Post-entanglement X/Z update the joint amplitude vector (not product Bloch alone).
 */
export function useBellPreparationSequence({
  enabled,
  applyH,
  applyZ,
  applyCNOT,
  isQubitBusy,
  isCnotBusy,
  thetaA,
  phiA,
  thetaB,
  phiB,
  setAnglesA,
  setAnglesB,
  jointAmps,
  onJointAmps,
  clearJointAmps,
  onDiscovery,
  onPrepared,
  onLinkBoost,
}: UseBellPreparationSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [readout, setReadout] = useState<BellPrepReadout | null>(null)
  const [gateHistory, setGateHistory] = useState<GateOperationRecord[]>([])

  const gateCountRef = useRef(0)
  const cancelledRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const anglesRef = useRef({ thetaA, phiA, thetaB, phiB })
  anglesRef.current = { thetaA, phiA, thetaB, phiB }

  const jointAmpsRef = useRef(jointAmps)
  jointAmpsRef.current = jointAmps

  const clearRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => {
    cancelledRef.current = true
    clearRaf()
  }, [clearRaf])

  useEffect(() => {
    if (!readout) return
    const id = window.setTimeout(() => setReadout(null), READOUT_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [readout])

  const dismissReadout = useCallback(() => setReadout(null), [])

  const animateJointSingleQubit = useCallback(
    (
      gate: 'X' | 'Z',
      qubit: QubitId,
      before: TwoQubitAmplitudes,
      after: TwoQubitAmplitudes,
    ) =>
      new Promise<void>((resolve) => {
        const setAngles = qubit === 'A' ? setAnglesA : setAnglesB
        const from = reducedBlochVector(before, qubit)
        const to = reducedBlochVector(after, qubit)
        const started = performance.now()

        // Z on a mixed reduced state: keep tip, still advance via soft lerp + amps.
        const tick = (now: number) => {
          if (cancelledRef.current) {
            resolve()
            return
          }
          const t = Math.min(1, (now - started) / JOINT_GATE_MS)
          const eased = easeInOutCubic(t)

          if (gate === 'X') {
            const next = xGateRotationAt(from.theta, from.phi, eased * Math.PI)
            // Prefer reduced-endpoint lerp when the reduced state is mixed.
            if (from.length < 0.2) {
              setAngles(
                from.theta + (to.theta - from.theta) * eased,
                from.phi + (to.phi - from.phi) * eased,
              )
            } else {
              setAngles(next.theta, next.phi)
            }
          } else {
            setAngles(
              from.theta + (to.theta - from.theta) * eased,
              from.phi + (to.phi - from.phi) * eased,
            )
          }

          if (t < 1) {
            rafRef.current = requestAnimationFrame(tick)
            return
          }

          const aAfter = reducedBlochVector(after, 'A')
          const bAfter = reducedBlochVector(after, 'B')
          setAnglesA(aAfter.theta, aAfter.phi)
          setAnglesB(bAfter.theta, bAfter.phi)
          onJointAmps(after)
          jointAmpsRef.current = after
          rafRef.current = null
          resolve()
        }

        rafRef.current = requestAnimationFrame(tick)
      }),
    [onJointAmps, setAnglesA, setAnglesB],
  )

  const prepareBellState = useCallback(
    (id: BellStateId) => {
      if (!enabled || busy) return

      const def = getBellState(id)
      cancelledRef.current = false
      clearRaf()
      setBusy(true)
      setReadout(null)

      void (async () => {
        try {
          // Reset → |00⟩ (clear any prior joint register)
          clearJointAmps()
          jointAmpsRef.current = null
          setAnglesA(0, 0)
          setAnglesB(0, 0)
          await sleep(STEP_GAP_MS)
          if (cancelledRef.current) return

          for (const op of def.operations) {
            if (cancelledRef.current) return

            if (op.type === 'H') {
              await runUntilIdle(
                () => applyH(op.qubit, { silent: true }),
                () => isQubitBusy(op.qubit),
              )
            } else if (op.type === 'Z') {
              const amps = jointAmpsRef.current
              if (amps) {
                const next = applySingleQubitGateToAmplitudes(
                  amps,
                  'Z',
                  op.qubit,
                )
                await animateJointSingleQubit('Z', op.qubit, amps, next)
              } else {
                await runUntilIdle(
                  () => applyZ(op.qubit, { silent: true }),
                  () => isQubitBusy(op.qubit),
                )
                // Z UI is phase-only; sync Bloch φ so CNOT builds Φ⁻ correctly.
                const a = anglesRef.current
                if (op.qubit === 'A') {
                  const next = applyZGate(a.thetaA, a.phiA)
                  setAnglesA(next.theta, next.phi)
                  anglesRef.current = {
                    ...a,
                    thetaA: next.theta,
                    phiA: next.phi,
                  }
                } else {
                  const next = applyZGate(a.thetaB, a.phiB)
                  setAnglesB(next.theta, next.phi)
                  anglesRef.current = {
                    ...a,
                    thetaB: next.theta,
                    phiB: next.phi,
                  }
                }
                await sleep(100)
              }
            } else if (op.type === 'X') {
              const amps = jointAmpsRef.current
              if (amps) {
                const next = applySingleQubitGateToAmplitudes(amps, 'X', op.qubit)
                await animateJointSingleQubit('X', op.qubit, amps, next)
              } else {
                // Should not happen for standard Bell sequences.
                await sleep(STEP_GAP_MS)
              }
            } else if (op.type === 'CNOT') {
              await runUntilIdle(
                () =>
                  applyCNOT(
                    { control: op.control, target: op.target },
                    { silent: true },
                  ),
                () => isCnotBusy(),
              )
            }

            await sleep(STEP_GAP_MS)
          }

          if (cancelledRef.current) return

          onPrepared?.(id)
          onDiscovery([`Prepared Bell State ${def.label}.`])
          onLinkBoost?.()

          gateCountRef.current += 1
          setGateHistory((prev) => [
            ...prev,
            createBellPreparationRecord({
              index: gateCountRef.current,
              bellLabel: def.label,
              operations: formatBellOperations(def.operations),
            }),
          ])

          // Delay so the learner first sees the finished Bell probabilities / link.
          await sleep(700)
          if (cancelledRef.current) return

          setReadout({
            title: 'Bell States',
            body: [
              'Bell states are the simplest maximally entangled quantum states.',
              'Although they all contain entanglement, they differ in how their measurement outcomes are correlated.',
              'These four states are the foundation of quantum communication, teleportation, and many quantum algorithms.',
            ],
          })
        } finally {
          setBusy(false)
        }
      })()
    },
    [
      animateJointSingleQubit,
      applyCNOT,
      applyH,
      applyZ,
      busy,
      clearJointAmps,
      clearRaf,
      enabled,
      isCnotBusy,
      isQubitBusy,
      onDiscovery,
      onLinkBoost,
      onPrepared,
      setAnglesA,
      setAnglesB,
    ],
  )

  return {
    prepareBellState,
    busy,
    readout,
    dismissReadout,
    gateHistory,
    linkBoostMs: LINK_BOOST_MS,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { runCNOT, type CNOTSelection } from '../lib/gates/cnotGate'
import { xGateRotationAt } from '../lib/gates/xGate'
import {
  createCNOTOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'
import { qubitDisplayName, type QubitId } from '../lib/qubitId'
import type { TwoQubitAmplitudes } from '../lib/twoQubitState'

const DURATION_MS = 850
const READOUT_DISMISS_MS = 7000

export type CNOTReadout = {
  title: string
  body: string[]
}

export type CNOTPulseState = {
  control: QubitId
  target: QubitId
  /** 0→1 link progress. */
  progress: number
  activated: boolean
}

type UseCNOTSequenceArgs = {
  enabled: boolean
  thetaA: number
  phiA: number
  thetaB: number
  phiB: number
  setAnglesA: (theta: number, phi: number) => void
  setAnglesB: (theta: number, phi: number) => void
  jointAmps: TwoQubitAmplitudes | null
  onJointAmps: (amps: TwoQubitAmplitudes) => void
  onDiscovery: (message: string | string[]) => void
}

export function useCNOTSequence({
  enabled,
  thetaA,
  phiA,
  thetaB,
  phiB,
  setAnglesA,
  setAnglesB,
  jointAmps,
  onJointAmps,
  onDiscovery,
}: UseCNOTSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [readout, setReadout] = useState<CNOTReadout | null>(null)
  const [pulse, setPulse] = useState<CNOTPulseState | null>(null)
  const [gateHistory, setGateHistory] = useState<GateOperationRecord[]>([])

  const gateCountRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])

  const liveRef = useRef({
    thetaA,
    phiA,
    thetaB,
    phiB,
    jointAmps,
  })
  liveRef.current = { thetaA, phiA, thetaB, phiB, jointAmps }

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    if (!readout) return
    const id = window.setTimeout(() => setReadout(null), READOUT_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [readout])

  const dismissReadout = useCallback(() => setReadout(null), [])

  const applyCNOT = useCallback(
    (selection: CNOTSelection, options?: { silent?: boolean }) => {
      if (!enabled || busy) return
      if (selection.control === selection.target) return

      const silent = options?.silent === true
      const live = liveRef.current
      const result = runCNOT(
        live.thetaA,
        live.phiA,
        live.thetaB,
        live.phiB,
        selection,
        live.jointAmps,
      )

      clearTimers()
      setBusy(true)
      setReadout(null)

      const started = performance.now()
      const targetSetAngles =
        selection.target === 'A' ? setAnglesA : setAnglesB

      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / DURATION_MS)
        const eased = easeInOutCubic(t)

        setPulse({
          control: selection.control,
          target: selection.target,
          progress: eased,
          activated: result.activated,
        })

        if (result.animateTargetX) {
          const angle = eased * Math.PI
          const next = xGateRotationAt(
            result.targetBefore.theta,
            result.targetBefore.phi,
            angle,
          )
          targetSetAngles(next.theta, next.phi)
        } else if (result.activated) {
          // Soft lerp of the target toward its reduced post-CNOT state.
          const from = result.targetBefore
          const to = result.targetAfter
          targetSetAngles(
            from.theta + (to.theta - from.theta) * eased,
            from.phi + (to.phi - from.phi) * eased,
          )
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }

        setAnglesA(result.qubitAAfter.theta, result.qubitAAfter.phi)
        setAnglesB(result.qubitBAfter.theta, result.qubitBAfter.phi)
        onJointAmps(result.after)

        if (!silent) {
          onDiscovery(
            result.entangled
              ? [
                  'Entanglement created.',
                  'These qubits now share a single quantum state.',
                ]
              : result.discovery,
          )

          gateCountRef.current += 1
          setGateHistory((prev) => [
            ...prev,
            createCNOTOperationRecord({
              index: gateCountRef.current,
              controlLabel: qubitDisplayName(selection.control),
              targetLabel: qubitDisplayName(selection.target),
              result: result.logResult,
              entangled: result.entangled,
            }),
          ])

          const cnotCard: CNOTReadout = {
            title: 'Controlled-NOT (CNOT)',
            body: [
              'The CNOT gate acts on two qubits.',
              'One qubit becomes the Control. The other becomes the Target.',
              'The Target flips only when the Control is in the |1⟩ state.',
              'This is the first gate that links two qubits together.',
              'It forms the foundation of quantum algorithms and is the key ingredient for creating entanglement.',
            ],
          }

          const entanglementCard: CNOTReadout = {
            title: 'Entanglement',
            body: [
              'These two qubits are no longer independent.',
              'Together they form a single quantum state.',
              'Measuring one qubit immediately determines the outcome of the other—not because information is sent between them at that moment, but because the pair must be described as one quantum system.',
              'Entanglement is one of the defining features of quantum mechanics and a key resource for quantum computing.',
            ],
          }

          // Let the learner see the Bell probabilities / quantum link first.
          if (result.entangled) {
            timersRef.current.push(
              window.setTimeout(() => setReadout(entanglementCard), 1600),
            )
          } else {
            setReadout(cnotCard)
          }
        }

        setPulse(null)
        setBusy(false)
        rafRef.current = null
      }

      timersRef.current.push(
        window.setTimeout(() => {
          rafRef.current = requestAnimationFrame(tick)
        }, 60),
      )
    },
    [
      busy,
      clearTimers,
      enabled,
      onDiscovery,
      onJointAmps,
      setAnglesA,
      setAnglesB,
    ],
  )

  return {
    applyCNOT,
    busy,
    pulse,
    readout,
    dismissReadout,
    gateHistory,
  }
}

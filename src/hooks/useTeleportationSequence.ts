import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { applyHGate } from '../lib/gates/hGate'
import { applyXGate } from '../lib/gates/xGate'
import { applyZGate } from '../lib/gates/zGate'
import {
  createTeleportationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'
import {
  aliceSourceState,
  buildTeleportSnapshot,
  lerpAngles,
  reducedBloch3,
  runTeleportationProtocol,
  type TeleportCorrection,
} from '../lib/teleportation'

const GATE_MS = 750
const PAUSE_MS = 350
const MEASURE_MS = 900
const COMM_MS = 800
const CORRECT_MS = 850
const REVEAL_MS = 700
const READOUT_DISMISS_MS = 9000
const EDU_DELAY_MS = 600

export type TeleportReadout = {
  title: string
  body: string[]
}

export type TeleportSphereView = {
  label: string
  theta: number
  phi: number
  measurementPulse: number
}

export type TeleportSceneView = {
  alice: TeleportSphereView
  pair: TeleportSphereView
  bob: TeleportSphereView
  entangled: boolean
  commProgress: number
}

type UseTeleportationSequenceArgs = {
  enabled: boolean
  learnerTheta: number
  learnerPhi: number
  onDiscovery: (message: string | string[]) => void
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function animateAngles(
  from: { theta: number; phi: number },
  to: { theta: number; phi: number },
  durationMs: number,
  onFrame: (next: { theta: number; phi: number }) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs)
      onFrame(lerpAngles(from, to, easeInOutCubic(t)))
      if (t < 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })
}

function blochFromAmps(
  amps: ReturnType<typeof buildTeleportSnapshot>,
  qubit: 0 | 1 | 2,
): { theta: number; phi: number } {
  const v = reducedBloch3(amps, qubit)
  return { theta: v.theta, phi: v.phi }
}

export function useTeleportationSequence({
  enabled,
  learnerTheta,
  learnerPhi,
  onDiscovery,
}: UseTeleportationSequenceArgs) {
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [readout, setReadout] = useState<TeleportReadout | null>(null)
  const [gateHistory, setGateHistory] = useState<GateOperationRecord[]>([])
  const [classicalBits, setClassicalBits] = useState<string | null>(null)
  const [scene, setScene] = useState<TeleportSceneView | null>(null)

  const gateCountRef = useRef(0)
  const cancelledRef = useRef(false)
  const sourceRef = useRef({ theta: 0, phi: 0 })

  useEffect(() => {
    if (!readout) return
    const id = window.setTimeout(() => setReadout(null), READOUT_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [readout])

  const dismissReadout = useCallback(() => setReadout(null), [])

  const setSphere = useCallback(
    (
      alice: { theta: number; phi: number },
      pair: { theta: number; phi: number },
      bob: { theta: number; phi: number },
      opts?: {
        entangled?: boolean
        commProgress?: number
        pulse?: { alice?: number; pair?: number; bob?: number }
      },
    ) => {
      setScene({
        alice: {
          label: 'Alice',
          theta: alice.theta,
          phi: alice.phi,
          measurementPulse: opts?.pulse?.alice ?? 0,
        },
        pair: {
          label: 'Entangled Pair',
          theta: pair.theta,
          phi: pair.phi,
          measurementPulse: opts?.pulse?.pair ?? 0,
        },
        bob: {
          label: 'Bob',
          theta: bob.theta,
          phi: bob.phi,
          measurementPulse: opts?.pulse?.bob ?? 0,
        },
        entangled: opts?.entangled ?? false,
        commProgress: opts?.commProgress ?? 0,
      })
    },
    [],
  )

  const resetTeleport = useCallback(() => {
    cancelledRef.current = true
    setBusy(false)
    setActive(false)
    setScene(null)
    setClassicalBits(null)
    setReadout(null)
    onDiscovery([])
  }, [onDiscovery])

  const startTeleportation = useCallback(() => {
    if (!enabled || busy) return

    cancelledRef.current = false
    setBusy(true)
    setActive(true)
    setReadout(null)
    setClassicalBits(null)

    const source = aliceSourceState(learnerTheta, learnerPhi)
    sourceRef.current = source
    setSphere(source, { theta: 0, phi: 0 }, { theta: 0, phi: 0 })

    void (async () => {
      try {
        const zero = { theta: 0, phi: 0 }

        await sleep(PAUSE_MS)
        if (cancelledRef.current) return

        onDiscovery(['Preparing Bell pair…'])

        // Step 1 — H on pair qubit (q1), animate pair sphere
        const pairFrom = zero
        const hTarget = applyHGate(0, 0)
        await animateAngles(pairFrom, hTarget, GATE_MS, (next) => {
          setSphere(source, next, zero)
        })
        if (cancelledRef.current) return

        let amps = buildTeleportSnapshot(source.theta, source.phi, 'h-pair')
        let pairBloch = blochFromAmps(amps, 1)
        let bobBloch = blochFromAmps(amps, 2)

        // CNOT on pair — animate Bob toward entangled reduced state
        const afterCnot = buildTeleportSnapshot(source.theta, source.phi, 'cnot-pair')
        const pairEnd = blochFromAmps(afterCnot, 1)
        const bobEnd = blochFromAmps(afterCnot, 2)
        await animateAngles(pairBloch, pairEnd, GATE_MS, (next) => {
          setSphere(source, next, bobBloch, { entangled: true })
        })
        await animateAngles(bobBloch, bobEnd, GATE_MS, (next) => {
          pairBloch = pairEnd
          bobBloch = next
          setSphere(source, pairBloch, bobBloch, { entangled: true })
        })
        if (cancelledRef.current) return

        amps = afterCnot
        await sleep(PAUSE_MS)
        if (cancelledRef.current) return

        // Step 3 — Bell measurement on Alice + pair
        onDiscovery(['Bell measurement complete.'])
        const result = runTeleportationProtocol(source.theta, source.phi)
        const m0 = Number(result.classicalBits[0]) as 0 | 1
        const m1 = Number(result.classicalBits[1]) as 0 | 1
        const postMeasure = buildTeleportSnapshot(
          source.theta,
          source.phi,
          'post-measure',
          { m0, m1 },
        )
        const aliceCollapse = blochFromAmps(postMeasure, 0)
        const pairCollapse = blochFromAmps(postMeasure, 1)
        const bobPreCorrect = blochFromAmps(postMeasure, 2)

        setSphere(source, pairBloch, bobBloch, {
          entangled: true,
          pulse: { alice: 1 },
        })
        await sleep(MEASURE_MS * 0.45)
        if (cancelledRef.current) return

        setSphere(aliceCollapse, pairCollapse, bobPreCorrect, {
          entangled: false,
          pulse: { alice: 0.4, pair: 1 },
        })
        await sleep(MEASURE_MS * 0.55)
        if (cancelledRef.current) return

        setClassicalBits(result.classicalBits)
        onDiscovery(['Sending two classical bits…'])

        // Step 4 — classical communication line
        const commStart = performance.now()
        while (performance.now() - commStart < COMM_MS) {
          if (cancelledRef.current) return
          const t = (performance.now() - commStart) / COMM_MS
          setSphere(aliceCollapse, pairCollapse, bobPreCorrect, {
            commProgress: easeInOutCubic(t),
          })
          await sleep(16)
        }

        // Step 5 — correction on Bob
        onDiscovery(['Applying correction…'])
        const correction = result.correction
        let bobCurrent = bobPreCorrect
        const bobFinal = source

        if (correction === 'X' || correction === 'XZ') {
          const xFrom = bobCurrent
          const xTo = applyXGate(xFrom.theta, xFrom.phi)
          await animateAngles(xFrom, xTo, CORRECT_MS * 0.5, (next) => {
            bobCurrent = next
            setSphere(aliceCollapse, pairCollapse, bobCurrent, {
              commProgress: 1,
            })
          })
        }
        if (correction === 'Z' || correction === 'XZ') {
          const zFrom = bobCurrent
          const zTo = applyZGate(zFrom.theta, zFrom.phi)
          await animateAngles(zFrom, zTo, CORRECT_MS * 0.5, (next) => {
            bobCurrent = next
            setSphere(aliceCollapse, pairCollapse, bobCurrent, {
              commProgress: 1,
            })
          })
        }
        if (correction === 'I') {
          await sleep(CORRECT_MS * 0.4)
        }

        gateCountRef.current += 1
        const correctionLabel =
          correction === 'I' ? 'No correction' : `Applied ${correction} correction`
        setGateHistory((prev) => [
          ...prev,
          createTeleportationRecord({
            index: gateCountRef.current,
            classicalBits: result.classicalBits,
            correction: correctionLabel,
          }),
        ])

        // Step 6 — reveal Bob matches Alice
        onDiscovery(['Teleportation successful.'])
        await animateAngles(bobCurrent, bobFinal, REVEAL_MS, (next) => {
          setSphere(aliceCollapse, pairCollapse, next, { commProgress: 1 })
        })
        if (cancelledRef.current) return

        await sleep(EDU_DELAY_MS)
        if (cancelledRef.current) return

        setReadout({
          title: 'Quantum Teleportation',
          body: [
            'Nothing physical traveled between Alice and Bob.',
            'Only quantum information was transferred.',
            "The original state no longer exists on Alice's qubit.",
            'Instead, it has been reconstructed on Bob\'s qubit using:',
            '• entanglement',
            '• local operations',
            '• two classical bits',
            'Quantum teleportation transfers quantum states—not particles.',
          ],
        })
      } finally {
        setBusy(false)
      }
    })()
  }, [busy, enabled, learnerPhi, learnerTheta, onDiscovery, setSphere])

  return {
    active,
    busy,
    scene,
    classicalBits,
    readout,
    dismissReadout,
    gateHistory,
    startTeleportation,
    resetTeleport,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { tGatePhaseDelta } from '../lib/gates/tGate'
import {
  createTGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const READOUT_DISMISS_MS = 6500
const PHASE_NOTICE_MS = 4000
const PHASE_ANIM_MS = 800

export type TGateReadout = {
  title: string
  body: string[]
}

type UseTGateSequenceArgs = {
  enabled: boolean
  /** Animate the reusable phase layer by Δ radians. */
  animatePhaseAdvance: (delta: number, durationMs?: number) => Promise<void>
}

/**
 * T gate via the shared phase layer (π/4).
 * Bloch tip and measurement probabilities stay fixed —
 * only the phase visualization advances by 45°.
 */
export function useTGateSequence({
  enabled,
  animatePhaseAdvance,
}: UseTGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<TGateReadout | null>(null)
  const [phaseNotice, setPhaseNotice] = useState<string | null>(null)
  const [gateHistory, setGateHistory] = useState<GateOperationRecord[]>([])

  const gateCountRef = useRef(0)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    if (!readout) return
    const id = window.setTimeout(() => setReadout(null), READOUT_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [readout])

  const dismissReadout = useCallback(() => setReadout(null), [])

  const applyT = useCallback(() => {
    if (!enabled || busy) return

    clearTimers()
    setBusy(true)
    setGlowing(true)
    setReadout(null)
    setPhaseNotice(null)

    void (async () => {
      await new Promise<void>((r) => {
        timersRef.current.push(window.setTimeout(() => r(), 80))
      })

      await animatePhaseAdvance(tGatePhaseDelta(), PHASE_ANIM_MS)

      gateCountRef.current += 1
      setGateHistory((prev) => [
        ...prev,
        createTGateOperationRecord(gateCountRef.current),
      ])

      setReadout({
        title: 'T Gate',
        body: [
          'The T Gate performs a 45° phase rotation.',
          'Like the S Gate, it leaves measurement probabilities unchanged.',
          'Instead, it subtly changes the quantum phase.',
          'Although invisible to immediate measurement, these small phase changes dramatically influence how future quantum gates interact with the state.',
          'This precision is one reason quantum computation is so powerful.',
        ],
      })

      setPhaseNotice('Phase advanced by 45°.')
      timersRef.current.push(
        window.setTimeout(() => setPhaseNotice(null), PHASE_NOTICE_MS),
      )

      setGlowing(false)
      setBusy(false)
    })()
  }, [animatePhaseAdvance, busy, clearTimers, enabled])

  return {
    applyT,
    busy,
    glowing,
    readout,
    dismissReadout,
    gateHistory,
    phaseNotice,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { PHASE_GATE_DELTAS } from '../lib/phaseState'
import {
  createZGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const READOUT_DISMISS_MS = 6500
const PHASE_NOTICE_MS = 4000
const PHASE_ANIM_MS = 950

export type ZGateReadout = {
  title: string
  body: string[]
}

type UseZGateSequenceArgs = {
  enabled: boolean
  /** Animate the reusable phase layer by Δ radians. */
  animatePhaseAdvance: (delta: number, durationMs?: number) => Promise<void>
}

/**
 * Z gate via the phase layer only.
 * θ/φ (Bloch tip, probabilities, labels, readouts) stay fixed;
 * only the equatorial phase ring advances — teaching that phase changed.
 */
export function useZGateSequence({
  enabled,
  animatePhaseAdvance,
}: UseZGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<ZGateReadout | null>(null)
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

  const applyZ = useCallback((options?: { silent?: boolean }) => {
    if (!enabled || busy) return

    const silent = options?.silent === true
    clearTimers()
    setBusy(true)
    setGlowing(true)
    setReadout(null)
    setPhaseNotice(null)

    void (async () => {
      await new Promise<void>((r) => {
        timersRef.current.push(window.setTimeout(() => r(), 80))
      })

      await animatePhaseAdvance(PHASE_GATE_DELTAS.Z, PHASE_ANIM_MS)

      if (!silent) {
        gateCountRef.current += 1
        setGateHistory((prev) => [
          ...prev,
          createZGateOperationRecord(gateCountRef.current),
        ])

        setReadout({
          title: 'Phase Shift',
          body: [
            'The Z Gate changed the phase of the quantum state.',
            'Its measurement probabilities stayed exactly the same.',
            'Phase cannot be observed directly from one measurement.',
            'However, it changes how future quantum gates transform the state.',
          ],
        })

        setPhaseNotice(
          "Notice: The probabilities didn't change, but the quantum state did.",
        )
        timersRef.current.push(
          window.setTimeout(() => setPhaseNotice(null), PHASE_NOTICE_MS),
        )
      }

      setGlowing(false)
      setBusy(false)
    })()
  }, [animatePhaseAdvance, busy, clearTimers, enabled])

  return {
    applyZ,
    busy,
    glowing,
    readout,
    dismissReadout,
    gateHistory,
    phaseNotice,
  }
}

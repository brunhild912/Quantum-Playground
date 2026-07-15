import { useCallback, useEffect, useRef, useState } from 'react'
import { sGatePhaseDelta } from '../lib/gates/sGate'
import {
  createSGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const READOUT_DISMISS_MS = 6500
const PHASE_NOTICE_MS = 4000
const PHASE_ANIM_MS = 800

export type SGateReadout = {
  title: string
  body: string[]
}

type UseSGateSequenceArgs = {
  enabled: boolean
  /** Animate the reusable phase layer by Δ radians. */
  animatePhaseAdvance: (delta: number, durationMs?: number) => Promise<void>
}

/**
 * S gate via the shared phase layer (π/2).
 * Bloch tip and measurement probabilities stay fixed —
 * only the phase visualization advances by 90°.
 */
export function useSGateSequence({
  enabled,
  animatePhaseAdvance,
}: UseSGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<SGateReadout | null>(null)
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

  const applyS = useCallback(() => {
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

      await animatePhaseAdvance(sGatePhaseDelta(), PHASE_ANIM_MS)

      gateCountRef.current += 1
      setGateHistory((prev) => [
        ...prev,
        createSGateOperationRecord(gateCountRef.current),
      ])

      setReadout({
        title: 'S Gate',
        body: [
          'The S Gate performs a 90° phase rotation.',
          'Measurement probabilities remain unchanged, but the quantum state\'s phase advances.',
          'Phase affects how future gates interact with this qubit, even though nothing appears different when measuring it immediately.',
        ],
      })

      setPhaseNotice('Phase advanced by 90°.')
      timersRef.current.push(
        window.setTimeout(() => setPhaseNotice(null), PHASE_NOTICE_MS),
      )

      setGlowing(false)
      setBusy(false)
    })()
  }, [animatePhaseAdvance, busy, clearTimers, enabled])

  return {
    applyS,
    busy,
    glowing,
    readout,
    dismissReadout,
    gateHistory,
    phaseNotice,
  }
}

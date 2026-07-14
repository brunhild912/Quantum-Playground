import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { applyZGate, zGateRotationAt } from '../lib/gates/zGate'
import {
  createZGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const DURATION_MS = 800
const READOUT_DISMISS_MS = 6500
const PHASE_NOTICE_MS = 3800

export type ZGateReadout = {
  title: string
  body: string[]
}

type UseZGateSequenceArgs = {
  theta: number
  phi: number
  setAngles: (theta: number, phi: number) => void
  enabled: boolean
}

export function useZGateSequence({
  theta,
  phi,
  setAngles,
  enabled,
}: UseZGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<ZGateReadout | null>(null)
  const [phaseNotice, setPhaseNotice] = useState<string | null>(null)
  const [gateHistory, setGateHistory] = useState<GateOperationRecord[]>([])

  const thetaRef = useRef(theta)
  const phiRef = useRef(phi)
  thetaRef.current = theta
  phiRef.current = phi

  const gateCountRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])

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

  const applyZ = useCallback(() => {
    if (!enabled || busy) return

    const startTheta = thetaRef.current
    const startPhi = phiRef.current
    clearTimers()
    setBusy(true)
    setGlowing(true)
    setReadout(null)
    setPhaseNotice(null)

    const started = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION_MS)
      const eased = easeInOutCubic(t)
      const angle = eased * Math.PI
      const next = zGateRotationAt(startTheta, startPhi, angle)
      setAngles(next.theta, next.phi)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const finalState = applyZGate(startTheta, startPhi)
      setAngles(finalState.theta, finalState.phi)

      gateCountRef.current += 1
      setGateHistory((prev) => [
        ...prev,
        createZGateOperationRecord(gateCountRef.current),
      ])

      setReadout({
        title: 'Quantum Z Gate',
        body: [
          'The Z gate rotates the qubit around the Z axis.',
          'Notice that the probabilities did not change.',
          'The quantum state changed, even though measurements look exactly the same.',
        ],
      })

      setPhaseNotice(
        "Notice: The probabilities didn't change, but the quantum state did.",
      )
      timersRef.current.push(
        window.setTimeout(() => setPhaseNotice(null), PHASE_NOTICE_MS),
      )

      setGlowing(false)
      setBusy(false)
      rafRef.current = null
    }

    timersRef.current.push(
      window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick)
      }, 80),
    )
  }, [busy, clearTimers, enabled, setAngles])

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

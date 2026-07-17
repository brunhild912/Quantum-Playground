import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { applyXGate, xGateRotationAt } from '../lib/gates/xGate'
import {
  createXGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const DURATION_MS = 800
const READOUT_DISMISS_MS = 6500

export type XGateReadout = {
  title: string
  body: string[]
}

type UseXGateSequenceArgs = {
  theta: number
  phi: number
  setAngles: (theta: number, phi: number) => void
  enabled: boolean
}

export function useXGateSequence({
  theta,
  phi,
  setAngles,
  enabled,
}: UseXGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<XGateReadout | null>(null)
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

  const applyX = useCallback((options?: { silent?: boolean }) => {
    if (!enabled || busy) return

    const silent = options?.silent === true
    const startTheta = thetaRef.current
    const startPhi = phiRef.current
    clearTimers()
    setBusy(true)
    setGlowing(true)
    setReadout(null)

    const started = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION_MS)
      const eased = easeInOutCubic(t)
      const angle = eased * Math.PI
      const next = xGateRotationAt(startTheta, startPhi, angle)
      setAngles(next.theta, next.phi)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      // Snap to exact final state to avoid float drift.
      const finalState = applyXGate(startTheta, startPhi)
      setAngles(finalState.theta, finalState.phi)

      if (!silent) {
        gateCountRef.current += 1
        setGateHistory((prev) => [
          ...prev,
          createXGateOperationRecord(gateCountRef.current),
        ])

        setReadout({
          title: 'Quantum X Gate',
          body: [
            'The X gate rotates the qubit 180° about the X axis.',
            'It swaps |0⟩ and |1⟩ while continuously transforming every state in between.',
          ],
        })
      }

      setGlowing(false)
      setBusy(false)
      rafRef.current = null
    }

    // Brief button glow before motion dominates.
    timersRef.current.push(
      window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick)
      }, 80),
    )
  }, [busy, clearTimers, enabled, setAngles])

  return {
    applyX,
    busy,
    glowing,
    readout,
    dismissReadout,
    gateHistory,
  }
}

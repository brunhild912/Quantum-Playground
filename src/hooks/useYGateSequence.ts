import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { applyYGate, yGateRotationAt } from '../lib/gates/yGate'
import {
  createYGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const DURATION_MS = 800
const READOUT_DISMISS_MS = 6500

export type YGateReadout = {
  title: string
  body: string[]
}

type UseYGateSequenceArgs = {
  theta: number
  phi: number
  setAngles: (theta: number, phi: number) => void
  enabled: boolean
}

export function useYGateSequence({
  theta,
  phi,
  setAngles,
  enabled,
}: UseYGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<YGateReadout | null>(null)
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

  const applyY = useCallback(() => {
    if (!enabled || busy) return

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
      const next = yGateRotationAt(startTheta, startPhi, angle)
      setAngles(next.theta, next.phi)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const finalState = applyYGate(startTheta, startPhi)
      setAngles(finalState.theta, finalState.phi)

      gateCountRef.current += 1
      setGateHistory((prev) => [
        ...prev,
        createYGateOperationRecord(gateCountRef.current),
      ])

      setReadout({
        title: 'Y Gate',
        body: [
          'The quantum state has rotated around the Y axis.',
          'Unlike the X Gate, which rotates around the X axis, the Y Gate rotates the quantum state around the Y axis.',
          'It transforms every quantum state continuously, combining changes in both probability and phase.',
          'Quantum gates are best understood as rotations of the Bloch Sphere rather than simple value changes.',
        ],
      })

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
    applyY,
    busy,
    glowing,
    readout,
    dismissReadout,
    gateHistory,
  }
}

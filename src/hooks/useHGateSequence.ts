import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { applyHGate, hGateRotationAt } from '../lib/gates/hGate'
import {
  createHGateOperationRecord,
  type GateOperationRecord,
} from '../lib/gateOperationHistory'

const DURATION_MS = 800
const READOUT_DISMISS_MS = 6500

export type HGateReadout = {
  title: string
  body: string[]
}

type UseHGateSequenceArgs = {
  theta: number
  phi: number
  setAngles: (theta: number, phi: number) => void
  enabled: boolean
}

export function useHGateSequence({
  theta,
  phi,
  setAngles,
  enabled,
}: UseHGateSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [readout, setReadout] = useState<HGateReadout | null>(null)
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

  const applyH = useCallback(() => {
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
      const next = hGateRotationAt(startTheta, startPhi, eased * Math.PI)
      setAngles(next.theta, next.phi)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const finalState = applyHGate(startTheta, startPhi)
      setAngles(finalState.theta, finalState.phi)

      gateCountRef.current += 1
      setGateHistory((prev) => [
        ...prev,
        createHGateOperationRecord(gateCountRef.current),
      ])

      setReadout({
        title: 'Hadamard Gate',
        body: [
          'The Hadamard gate rotates a pole state into an even superposition.',
          'This prepares a qubit so a controlled gate can create quantum correlation.',
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
    applyH,
    busy,
    glowing,
    readout,
    dismissReadout,
    gateHistory,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  sampleMeasurement,
  type MeasurementOutcome,
} from '../lib/measureQubit'
import {
  createMeasurementRecord,
  type MeasurementRecord,
} from '../lib/measurementHistory'

export type MeasurementResult = {
  outcome: MeasurementOutcome
  percent0: number
  percent1: number
}

const COLLAPSE_MS = 550
const SEQUENCE_MS = 1000
const RESULT_DISMISS_MS = 6500

type UseMeasurementSequenceArgs = {
  theta: number
  setTheta: (theta: number) => void
  enabled: boolean
}

export function useMeasurementSequence({
  theta,
  setTheta,
  enabled,
}: UseMeasurementSequenceArgs) {
  const [busy, setBusy] = useState(false)
  const [pulse, setPulse] = useState(0)
  const [result, setResult] = useState<MeasurementResult | null>(null)
  const [history, setHistory] = useState<MeasurementRecord[]>([])

  const thetaRef = useRef(theta)
  thetaRef.current = theta
  const historyCountRef = useRef(0)

  const timersRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)

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
    if (!result) return
    const id = window.setTimeout(() => setResult(null), RESULT_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [result])

  const dismissResult = useCallback(() => setResult(null), [])

  const measure = useCallback(() => {
    if (!enabled || busy) return

    const sample = sampleMeasurement(thetaRef.current)
    clearTimers()
    setBusy(true)
    setPulse(1)
    setResult(null)

    const started = performance.now()

    const tick = (now: number) => {
      const elapsed = now - started
      if (elapsed >= SEQUENCE_MS) {
        setPulse(0)
        rafRef.current = null
        return
      }
      // Hold near full, then ease down after collapse.
      const hold = COLLAPSE_MS / SEQUENCE_MS
      const t = elapsed / SEQUENCE_MS
      const next =
        t < hold ? 1 : Math.max(0, 1 - (t - hold) / (1 - hold))
      setPulse(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    timersRef.current.push(
      window.setTimeout(() => {
        setTheta(sample.collapsedTheta)
        setResult({
          outcome: sample.outcome,
          percent0: sample.probabilities.percent0,
          percent1: sample.probabilities.percent1,
        })

        historyCountRef.current += 1
        const record = createMeasurementRecord({
          index: historyCountRef.current,
          probabilityZero: sample.probabilities.percent0,
          probabilityOne: sample.probabilities.percent1,
          measuredState: sample.outcome,
        })
        setHistory((prev) => [...prev, record])
      }, COLLAPSE_MS),
    )

    timersRef.current.push(
      window.setTimeout(() => {
        setBusy(false)
        setPulse(0)
      }, SEQUENCE_MS),
    )
  }, [busy, clearTimers, enabled, setTheta])

  return {
    measure,
    busy,
    pulse,
    result,
    dismissResult,
    history,
  }
}

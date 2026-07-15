import { useCallback, useEffect, useRef, useState } from 'react'
import { easeInOutCubic } from '../lib/easing'
import { normalizePhase } from '../lib/phaseState'

type UsePhaseLayerResult = {
  /** Absolute phase angle driving the visual layer (radians). */
  phase: number
  /** 0–1 emphasis while a phase gate is animating. */
  pulse: number
  /**
   * Smoothly advance the phase layer by `delta` radians.
   * Resolves when the animation completes.
   */
  animatePhaseAdvance: (delta: number, durationMs?: number) => Promise<void>
}

const DEFAULT_DURATION_MS = 900

/**
 * Reusable phase visualization state for Z / S / T (and future phase gates).
 * Independent from Bloch θ/φ updates and measurement/probability UI.
 */
export function usePhaseLayer(initialPhase = 0): UsePhaseLayerResult {
  const [phase, setPhase] = useState(() => normalizePhase(initialPhase))
  const [pulse, setPulse] = useState(0)

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const animatePhaseAdvance = useCallback(
    (delta: number, durationMs = DEFAULT_DURATION_MS) => {
      return new Promise<void>((resolve) => {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }

        const startPhase = phaseRef.current
        const started = performance.now()
        setPulse(1)

        const tick = (now: number) => {
          const t = Math.min(1, (now - started) / durationMs)
          const eased = easeInOutCubic(t)
          const next = normalizePhase(startPhase + delta * eased)
          setPhase(next)
          phaseRef.current = next
          setPulse(1 - eased * 0.35)

          if (t < 1) {
            rafRef.current = requestAnimationFrame(tick)
            return
          }

          const finalPhase = normalizePhase(startPhase + delta)
          setPhase(finalPhase)
          phaseRef.current = finalPhase
          setPulse(0)
          rafRef.current = null
          resolve()
        }

        rafRef.current = requestAnimationFrame(tick)
      })
    },
    [],
  )

  return { phase, pulse, animatePhaseAdvance }
}

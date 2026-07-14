import { useState } from 'react'
import { normalizePhi } from '../lib/gates/xGate'

export function useQubitState() {
  const [theta, setThetaState] = useState(0)
  const [phi, setPhiState] = useState(0)

  const setTheta = (value: number) => {
    console.log('[setTheta]', { theta: value })
    setThetaState(value)
  }

  const setPhi = (value: number) => {
    setPhiState(normalizePhi(value))
  }

  /** Silent dual update for gate animations (avoids per-frame logs). */
  const setAngles = (nextTheta: number, nextPhi: number) => {
    setThetaState(nextTheta)
    setPhiState(normalizePhi(nextPhi))
  }

  return { theta, phi, setTheta, setPhi, setAngles }
}

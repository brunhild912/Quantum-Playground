import { useState } from 'react'

export function useQubitState() {
  const [theta, setThetaState] = useState(0)
  const [phi, setPhi] = useState(0)

  const setTheta = (value: number) => {
    console.log('[setTheta]', { theta: value })
    setThetaState(value)
  }

  return { theta, phi, setTheta, setPhi }
}

import { useState } from 'react'

export function useQubitState() {
  const [theta, setTheta] = useState(0)
  const [phi, setPhi] = useState(0)

  return { theta, phi, setTheta, setPhi }
}

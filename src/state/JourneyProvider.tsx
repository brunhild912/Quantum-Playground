import { useRef, useState } from 'react'
import { JourneyContext, type JourneyPhase } from './journeyContext'

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<JourneyPhase>('landing')
  const transitionStartMsRef = useRef<number | null>(null)

  const beginJourney = () => {
    if (phase !== 'landing') return
    transitionStartMsRef.current = performance.now()
    setPhase('transition')
  }

  const enterPlayground = () => {
    if (phase !== 'transition') return
    setPhase('playground')
  }

  return (
    <JourneyContext.Provider
      value={{ phase, beginJourney, enterPlayground, transitionStartMsRef }}
    >
      {children}
    </JourneyContext.Provider>
  )
}


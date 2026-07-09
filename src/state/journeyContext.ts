import { createContext, useContext } from 'react'

export type JourneyPhase = 'landing' | 'transition' | 'playground'

export type JourneyContextValue = {
  phase: JourneyPhase
  beginJourney: () => void
  enterPlayground: () => void
  transitionStartMsRef: React.MutableRefObject<number | null>
}

export const JourneyContext = createContext<JourneyContextValue | null>(null)

export function useJourney() {
  const ctx = useContext(JourneyContext)
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider')
  return ctx
}


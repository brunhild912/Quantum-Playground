import LandingOverlay from './components/LandingOverlay'
import OpeningCurtain from './components/OpeningCurtain'
import ControlPanel from './components/ControlPanel'
import Scene from './components/Scene'
import { JourneyProvider } from './state/JourneyProvider'
import { useJourney } from './state/journeyContext'
import { useEffect, useMemo } from 'react'

function AppInner() {
  const { phase, beginJourney } = useJourney()

  // Disable scroll (wheel/touch) during the camera transition.
  useEffect(() => {
    if (phase !== 'transition') return

    const prevent = (e: Event) => e.preventDefault()
    window.addEventListener('wheel', prevent, { passive: false })
    window.addEventListener('touchmove', prevent, { passive: false })

    return () => {
      window.removeEventListener('wheel', prevent)
      window.removeEventListener('touchmove', prevent)
    }
  }, [phase])

  const quantumState = useMemo(() => ({ ket: '|0⟩' }), [])

  return (
    <div className="app-shell">
      <div className="space-gradient pointer-events-none absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />

      <section className="hero-stage" aria-label="Bloch Sphere exhibit">
        <Scene phase={phase} />
      </section>

      <LandingOverlay onBeginJourney={beginJourney} hidden={phase !== 'landing'} />
      {phase === 'playground' ? <ControlPanel state={quantumState} /> : null}
      <OpeningCurtain />
    </div>
  )
}

export default function App() {
  return (
    <JourneyProvider>
      <AppInner />
    </JourneyProvider>
  )
}

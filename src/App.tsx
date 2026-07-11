import LandingOverlay from './components/LandingOverlay'
import ObservationLog from './components/ObservationLog'
import OpeningCurtain from './components/OpeningCurtain'
import ControlPanel from './components/ControlPanel'
import Scene from './components/Scene'
import { level1MissionConsole } from './content/level1ObservationLog'
import { JourneyProvider } from './state/JourneyProvider'
import { useJourney } from './state/journeyContext'
import { useQubitState } from './hooks/useQubitState'
import { qubitStateLabel, type QubitStateName } from './lib/qubitState'
import { useEffect, useRef } from 'react'

function AppInner() {
  const { phase, beginJourney } = useJourney()
  const { theta, phi, setTheta, setPhi } = useQubitState()
  const previousStateRef = useRef<QubitStateName>('|0⟩')

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

  const previousLabel = previousStateRef.current
  const stateLabel = qubitStateLabel(theta, previousLabel)
  previousStateRef.current = stateLabel

  console.log('[AppInner render]', {
    theta,
    previousLabel,
    returnedLabel: stateLabel,
    renderedLabel: stateLabel,
  })

  return (
    <div className={`app-shell${phase === 'playground' ? ' app-shell--playground' : ''}`}>
      <div className="space-gradient pointer-events-none absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />

      <section className="hero-stage" aria-label="Bloch Sphere exhibit">
        <Scene
          phase={phase}
          qubit={phase === 'playground' ? { theta, phi } : null}
        />
      </section>

      <LandingOverlay onBeginJourney={beginJourney} hidden={phase !== 'landing'} />

      {phase === 'playground' ? (
        <ObservationLog
          content={level1MissionConsole}
          theta={theta}
          phi={phi}
        />
      ) : null}

      {phase === 'playground' ? (
        <ControlPanel
          stateLabel={stateLabel}
          theta={theta}
          phi={phi}
          onThetaChange={setTheta}
          onPhiChange={setPhi}
        />
      ) : null}
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

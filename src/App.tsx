import LandingOverlay from './components/LandingOverlay'
import ObservationLog from './components/ObservationLog'
import OpeningCurtain from './components/OpeningCurtain'
import ControlPanel from './components/ControlPanel'
import ProbabilityPanel from './components/ProbabilityPanel'
import MeasureButton from './components/MeasureButton'
import MeasurementResultPanel from './components/MeasurementResultPanel'
import Scene from './components/Scene'
import { level1MissionConsole } from './content/level1ObservationLog'
import { JourneyProvider } from './state/JourneyProvider'
import { useJourney } from './state/journeyContext'
import { useQubitState } from './hooks/useQubitState'
import { useMeasurementSequence } from './hooks/useMeasurementSequence'
import { qubitStateLabel } from './lib/qubitState'
import { useEffect, useMemo } from 'react'

function AppInner() {
  const { phase, beginJourney } = useJourney()
  const { theta, phi, setTheta, setPhi } = useQubitState()
  const { measure, busy, pulse, result, dismissResult, history } =
    useMeasurementSequence({
      theta,
      setTheta,
      enabled: phase === 'playground',
    })

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

  const stateLabel = useMemo(() => qubitStateLabel(theta), [theta])

  const shellClass = [
    'app-shell',
    phase === 'playground' ? 'app-shell--playground' : '',
    busy ? 'app-shell--measuring' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <div className="space-gradient pointer-events-none absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />

      <section className="hero-stage" aria-label="Bloch Sphere exhibit">
        <Scene
          phase={phase}
          qubit={phase === 'playground' ? { theta, phi } : null}
          measurementPulse={pulse}
        />
      </section>

      <LandingOverlay onBeginJourney={beginJourney} hidden={phase !== 'landing'} />

      {phase === 'playground' ? (
        <ObservationLog
          content={level1MissionConsole}
          theta={theta}
          phi={phi}
          measurementHistory={history}
        />
      ) : null}

      {phase === 'playground' ? (
        <ProbabilityPanel theta={theta} />
      ) : null}

      {phase === 'playground' ? (
        <MeasureButton onMeasure={measure} disabled={busy} />
      ) : null}

      {phase === 'playground' && result ? (
        <MeasurementResultPanel result={result} onClose={dismissResult} />
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

import LandingOverlay from './components/LandingOverlay'
import ObservationLog from './components/ObservationLog'
import OpeningCurtain from './components/OpeningCurtain'
import ControlPanel from './components/ControlPanel'
import ProbabilityPanel from './components/ProbabilityPanel'
import MeasureButton from './components/MeasureButton'
import MeasurementResultPanel from './components/MeasurementResultPanel'
import GateInfoPanel from './components/GateInfoPanel'
import Scene from './components/Scene'
import { level1MissionConsole } from './content/level1ObservationLog'
import { JourneyProvider } from './state/JourneyProvider'
import { useJourney } from './state/journeyContext'
import { useQubitState } from './hooks/useQubitState'
import { useMeasurementSequence } from './hooks/useMeasurementSequence'
import { useXGateSequence } from './hooks/useXGateSequence'
import { useYGateSequence } from './hooks/useYGateSequence'
import { useZGateSequence } from './hooks/useZGateSequence'
import { useSGateSequence } from './hooks/useSGateSequence'
import { usePhaseLayer } from './hooks/usePhaseLayer'
import { qubitStateLabel } from './lib/qubitState'
import { useEffect, useMemo } from 'react'

function AppInner() {
  const { phase, beginJourney } = useJourney()
  const { theta, phi, setTheta, setPhi, setAngles } = useQubitState()
  const {
    phase: phaseAngle,
    pulse: phasePulse,
    animatePhaseAdvance,
  } = usePhaseLayer()

  const {
    applyX,
    busy: xBusy,
    glowing: xGlowing,
    readout: xReadout,
    dismissReadout: dismissXReadout,
    gateHistory: xHistory,
  } = useXGateSequence({
    theta,
    phi,
    setAngles,
    enabled: phase === 'playground',
  })

  const {
    applyY,
    busy: yBusy,
    glowing: yGlowing,
    readout: yReadout,
    dismissReadout: dismissYReadout,
    gateHistory: yHistory,
  } = useYGateSequence({
    theta,
    phi,
    setAngles,
    enabled: phase === 'playground' && !xBusy,
  })

  const {
    applyZ,
    busy: zBusy,
    glowing: zGlowing,
    readout: zReadout,
    dismissReadout: dismissZReadout,
    gateHistory: zHistory,
    phaseNotice: zPhaseNotice,
  } = useZGateSequence({
    enabled: phase === 'playground' && !xBusy && !yBusy,
    animatePhaseAdvance,
  })

  const {
    applyS,
    busy: sBusy,
    glowing: sGlowing,
    readout: sReadout,
    dismissReadout: dismissSReadout,
    gateHistory: sHistory,
    phaseNotice: sPhaseNotice,
  } = useSGateSequence({
    enabled: phase === 'playground' && !xBusy && !yBusy && !zBusy,
    animatePhaseAdvance,
  })

  const gateBusy = xBusy || yBusy || zBusy || sBusy
  const phaseNotice = sPhaseNotice ?? zPhaseNotice
  const gateReadout = sReadout ?? yReadout ?? zReadout ?? xReadout
  const dismissGateReadout = sReadout
    ? dismissSReadout
    : yReadout
      ? dismissYReadout
      : zReadout
        ? dismissZReadout
        : dismissXReadout
  const gateHistory = useMemo(
    () => [...xHistory, ...yHistory, ...zHistory, ...sHistory],
    [xHistory, yHistory, zHistory, sHistory],
  )

  const { measure, busy: measureBusy, pulse, result, dismissResult, history } =
    useMeasurementSequence({
      theta,
      setTheta,
      enabled: phase === 'playground' && !gateBusy,
    })

  const controlsLocked = measureBusy || gateBusy

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
    controlsLocked ? 'app-shell--measuring' : '',
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
          phaseAngle={phaseAngle}
          phasePulse={phasePulse}
        />
      </section>

      <LandingOverlay onBeginJourney={beginJourney} hidden={phase !== 'landing'} />

      {phase === 'playground' ? (
        <div className="instrument-shelf">
          <div className="instrument-shelf-primary">
            <ProbabilityPanel theta={theta} notice={phaseNotice} />
            <MeasureButton
              onMeasure={measure}
              onXGate={applyX}
              onYGate={applyY}
              onZGate={applyZ}
              onSGate={applyS}
              disabled={controlsLocked}
              xGlowing={xGlowing}
              yGlowing={yGlowing}
              zGlowing={zGlowing}
              sGlowing={sGlowing}
            />
          </div>

          <div className="instrument-shelf-state-wrap">
            <ObservationLog
              content={level1MissionConsole}
              theta={theta}
              phi={phi}
              measurementHistory={history}
              gateOperations={gateHistory}
            />
            <ControlPanel
              stateLabel={stateLabel}
              theta={theta}
              phi={phi}
              onThetaChange={setTheta}
              onPhiChange={setPhi}
            />
          </div>
        </div>
      ) : null}

      {phase === 'playground' && result ? (
        <MeasurementResultPanel result={result} onClose={dismissResult} />
      ) : null}

      {phase === 'playground' && gateReadout && !result ? (
        <GateInfoPanel readout={gateReadout} onClose={dismissGateReadout} />
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

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
import { useTGateSequence } from './hooks/useTGateSequence'
import { usePhaseLayer } from './hooks/usePhaseLayer'
import { qubitStateLabel } from './lib/qubitState'
import { useEffect, useMemo, useState } from 'react'

const MOBILE_EDU_CARD_DELAY_MS = 2000
const MOBILE_LAYOUT_MQ = '(max-width: 767.98px)'

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

  const {
    applyT,
    busy: tBusy,
    glowing: tGlowing,
    readout: tReadout,
    dismissReadout: dismissTReadout,
    gateHistory: tHistory,
    phaseNotice: tPhaseNotice,
  } = useTGateSequence({
    enabled: phase === 'playground' && !xBusy && !yBusy && !zBusy && !sBusy,
    animatePhaseAdvance,
  })

  const gateBusy = xBusy || yBusy || zBusy || sBusy || tBusy
  const phaseNotice = tPhaseNotice ?? sPhaseNotice ?? zPhaseNotice
  const gateReadout = tReadout ?? sReadout ?? yReadout ?? zReadout ?? xReadout
  const dismissGateReadout = tReadout
    ? dismissTReadout
    : sReadout
      ? dismissSReadout
      : yReadout
        ? dismissYReadout
        : zReadout
          ? dismissZReadout
          : dismissXReadout
  const gateHistory = useMemo(
    () => [...xHistory, ...yHistory, ...zHistory, ...sHistory, ...tHistory],
    [xHistory, yHistory, zHistory, sHistory, tHistory],
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

  // Mobile: let the gate animation settle before Learning Notes appear.
  // Desktop / tablet keep the existing immediate card timing.
  const [shownGateReadout, setShownGateReadout] = useState<typeof gateReadout>(
    null,
  )

  useEffect(() => {
    if (!gateReadout) {
      setShownGateReadout(null)
      return
    }

    const mobile = window.matchMedia(MOBILE_LAYOUT_MQ).matches
    if (!mobile) {
      setShownGateReadout(gateReadout)
      return
    }

    setShownGateReadout(null)
    const id = window.setTimeout(() => {
      setShownGateReadout(gateReadout)
    }, MOBILE_EDU_CARD_DELAY_MS)

    return () => window.clearTimeout(id)
  }, [gateReadout])

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
          <div className="instrument-shelf-main">
            <ProbabilityPanel theta={theta} notice={phaseNotice} />
            <ControlPanel
              stateLabel={stateLabel}
              theta={theta}
              phi={phi}
              onThetaChange={setTheta}
              onPhiChange={setPhi}
            />
          </div>

          <div className="instrument-shelf-tools">
            <MeasureButton
              onMeasure={measure}
              onXGate={applyX}
              onYGate={applyY}
              onZGate={applyZ}
              onSGate={applyS}
              onTGate={applyT}
              disabled={controlsLocked}
              xGlowing={xGlowing}
              yGlowing={yGlowing}
              zGlowing={zGlowing}
              sGlowing={sGlowing}
              tGlowing={tGlowing}
            />
            <ObservationLog
              content={level1MissionConsole}
              theta={theta}
              phi={phi}
              measurementHistory={history}
              gateOperations={gateHistory}
            />
          </div>
        </div>
      ) : null}

      {phase === 'playground' && shownGateReadout && !result ? (
        <GateInfoPanel
          readout={shownGateReadout}
          onClose={dismissGateReadout}
        />
      ) : null}

      {phase === 'playground' && result ? (
        <MeasurementResultPanel result={result} onClose={dismissResult} />
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

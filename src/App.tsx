import LandingOverlay from './components/LandingOverlay'
import ObservationLog from './components/ObservationLog'
import OpeningCurtain from './components/OpeningCurtain'
import MeasurementResultPanel from './components/MeasurementResultPanel'
import GateInfoPanel from './components/GateInfoPanel'
import QubitInstrument from './components/QubitInstrument'
import CompositeStatePanel from './components/CompositeStatePanel'
import ControlledOperationsPanel from './components/ControlledOperationsPanel'
import Scene from './components/Scene'
import { level1MissionConsole } from './content/level1ObservationLog'
import { JourneyProvider } from './state/JourneyProvider'
import { useJourney } from './state/journeyContext'
import { useQubitController } from './hooks/useQubitController'
import { useCNOTSequence } from './hooks/useCNOTSequence'
import { discoveryReadoutTwoQubits } from './lib/discoveryReadout'
import { compositeFromAmplitudes } from './lib/twoQubitState'
import type { TwoQubitAmplitudes } from './lib/twoQubitState'
import type { QubitId } from './lib/qubitId'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MOBILE_EDU_CARD_DELAY_MS = 2000
const MOBILE_LAYOUT_MQ = '(max-width: 767.98px)'

function useIsMobileLayout() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LAYOUT_MQ)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}

function AppInner() {
  const { phase, beginJourney } = useJourney()
  const playground = phase === 'playground'
  const mobileLayout = useIsMobileLayout()

  const qubitA = useQubitController('A', playground)
  const qubitB = useQubitController('B', playground)

  const [jointAmps, setJointAmps] = useState<TwoQubitAmplitudes | null>(null)
  const [cnotDiscovery, setCnotDiscovery] = useState<string | null>(null)

  const [cnotControl, setCnotControl] = useState<QubitId>('A')
  const [cnotTarget, setCnotTarget] = useState<QubitId>('B')

  // While CNOT runs, angle tweens must not wipe the joint vector.
  // After CNOT commits angles + amplitudes, skip one product resync.
  const skipNextProductSyncRef = useRef(false)

  const onJointAmps = useCallback((amps: TwoQubitAmplitudes) => {
    skipNextProductSyncRef.current = true
    setJointAmps(amps)
  }, [])

  const onCnotDiscovery = useCallback((message: string) => {
    setCnotDiscovery(message)
  }, [])

  const {
    applyCNOT,
    busy: cnotBusy,
    pulse: cnotPulse,
    readout: cnotReadout,
    dismissReadout: dismissCnotReadout,
    gateHistory: cnotHistory,
  } = useCNOTSequence({
    enabled: playground && !qubitA.controlsLocked && !qubitB.controlsLocked,
    thetaA: qubitA.theta,
    phiA: qubitA.phi,
    thetaB: qubitB.theta,
    phiB: qubitB.phi,
    setAnglesA: qubitA.setAngles,
    setAnglesB: qubitB.setAngles,
    jointAmps,
    onJointAmps,
    onDiscovery: onCnotDiscovery,
  })

  useEffect(() => {
    if (cnotBusy) return
    if (skipNextProductSyncRef.current) {
      skipNextProductSyncRef.current = false
      return
    }
    setJointAmps(null)
  }, [qubitA.theta, qubitA.phi, qubitB.theta, qubitB.phi, cnotBusy])

  const gateReadout =
    cnotReadout ?? qubitA.gateReadout ?? qubitB.gateReadout
  const dismissGateReadout = cnotReadout
    ? dismissCnotReadout
    : qubitA.gateReadout
      ? qubitA.dismissGateReadout
      : qubitB.dismissGateReadout

  const result = qubitA.result ?? qubitB.result
  const dismissResult = qubitA.result
    ? qubitA.dismissResult
    : qubitB.dismissResult

  const gateHistory = useMemo(
    () => [...qubitA.gateHistory, ...qubitB.gateHistory, ...cnotHistory],
    [qubitA.gateHistory, qubitB.gateHistory, cnotHistory],
  )

  const measurementHistory = useMemo(
    () => [...qubitA.measurementHistory, ...qubitB.measurementHistory],
    [qubitA.measurementHistory, qubitB.measurementHistory],
  )

  const discoveryLines = useMemo(() => {
    const base = discoveryReadoutTwoQubits(
      { label: qubitA.name, theta: qubitA.theta },
      { label: qubitB.name, theta: qubitB.theta },
    )
    if (cnotDiscovery) return [cnotDiscovery, ...base]
    return base
  }, [
    cnotDiscovery,
    qubitA.name,
    qubitA.theta,
    qubitB.name,
    qubitB.theta,
  ])

  const compositeOverride = useMemo(
    () => (jointAmps ? compositeFromAmplitudes(jointAmps) : null),
    [jointAmps],
  )

  const sceneQubits = useMemo(
    () => [
      {
        id: qubitA.id,
        label: qubitA.name,
        theta: qubitA.theta,
        phi: qubitA.phi,
        measurementPulse:
          qubitA.pulse ||
          (cnotPulse?.control === 'A' || cnotPulse?.target === 'A'
            ? 0.35 + (cnotPulse?.progress ?? 0) * 0.4
            : 0),
        phase: qubitA.phaseAngle,
        phasePulse: qubitA.phasePulse,
      },
      {
        id: qubitB.id,
        label: qubitB.name,
        theta: qubitB.theta,
        phi: qubitB.phi,
        measurementPulse:
          qubitB.pulse ||
          (cnotPulse?.control === 'B' || cnotPulse?.target === 'B'
            ? 0.35 + (cnotPulse?.progress ?? 0) * 0.4
            : 0),
        phase: qubitB.phaseAngle,
        phasePulse: qubitB.phasePulse,
      },
    ],
    [
      qubitA.id,
      qubitA.name,
      qubitA.theta,
      qubitA.phi,
      qubitA.pulse,
      qubitA.phaseAngle,
      qubitA.phasePulse,
      qubitB.id,
      qubitB.name,
      qubitB.theta,
      qubitB.phi,
      qubitB.pulse,
      qubitB.phaseAngle,
      qubitB.phasePulse,
      cnotPulse,
    ],
  )

  const controlsLocked =
    qubitA.controlsLocked || qubitB.controlsLocked || cnotBusy

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

  const [shownGateReadout, setShownGateReadout] = useState<typeof gateReadout>(
    null,
  )

  const [compositeIntro, setCompositeIntro] = useState<{
    title: string
    body: string[]
  } | null>(null)
  const compositeIntroShownRef = useRef(false)

  useEffect(() => {
    if (!playground) {
      compositeIntroShownRef.current = false
      setCompositeIntro(null)
      return
    }
    if (compositeIntroShownRef.current) return

    const delay = mobileLayout ? MOBILE_EDU_CARD_DELAY_MS : 900
    const id = window.setTimeout(() => {
      compositeIntroShownRef.current = true
      setCompositeIntro({
        title: 'Composite Quantum State',
        body: [
          'Each qubit still has two possible measurement outcomes.',
          'Together, however, they create four computational basis states: |00⟩, |01⟩, |10⟩, and |11⟩.',
          'Notice that the number of basis states doubles with every additional qubit.',
        ],
      })
    }, delay)

    return () => window.clearTimeout(id)
  }, [playground, mobileLayout])

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

  const learningReadout = shownGateReadout ?? compositeIntro
  const dismissLearningReadout = shownGateReadout
    ? dismissGateReadout
    : () => setCompositeIntro(null)

  const shellClass = [
    'app-shell',
    playground ? 'app-shell--playground' : '',
    playground ? 'app-shell--dual' : '',
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
          qubits={playground ? sceneQubits : null}
          stackVertical={mobileLayout}
        />
      </section>

      <LandingOverlay onBeginJourney={beginJourney} hidden={phase !== 'landing'} />

      {playground ? (
        <div className="instrument-shelf instrument-shelf--dual">
          <QubitInstrument qubit={qubitA} locked={cnotBusy} />
          <QubitInstrument qubit={qubitB} locked={cnotBusy} />
          <ControlledOperationsPanel
            control={cnotControl}
            target={cnotTarget}
            onControlChange={setCnotControl}
            onTargetChange={setCnotTarget}
            onApply={() =>
              applyCNOT({ control: cnotControl, target: cnotTarget })
            }
            disabled={controlsLocked}
            pulseProgress={cnotPulse?.progress ?? null}
          />
          <CompositeStatePanel
            thetaA={qubitA.theta}
            thetaB={qubitB.theta}
            compositeOverride={compositeOverride}
          />
          <div className="instrument-shelf-log">
            <ObservationLog
              content={level1MissionConsole}
              theta={qubitA.theta}
              phi={qubitA.phi}
              measurementHistory={measurementHistory}
              gateOperations={gateHistory}
              discoveryLinesOverride={discoveryLines}
            />
          </div>
        </div>
      ) : null}

      {playground && learningReadout && !result ? (
        <GateInfoPanel
          readout={learningReadout}
          onClose={dismissLearningReadout}
        />
      ) : null}

      {playground && result ? (
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

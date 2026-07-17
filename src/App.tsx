import LandingOverlay from './components/LandingOverlay'
import ObservationLog from './components/ObservationLog'
import OpeningCurtain from './components/OpeningCurtain'
import MeasurementResultPanel from './components/MeasurementResultPanel'
import GateInfoPanel from './components/GateInfoPanel'
import QubitInstrument from './components/QubitInstrument'
import CompositeStatePanel from './components/CompositeStatePanel'
import ControlledOperationsPanel from './components/ControlledOperationsPanel'
import BellStatePreparationPanel from './components/BellStatePreparationPanel'
import BellCorrelationLab from './components/BellCorrelationLab'
import type { CorrelationTrial } from './components/BellCorrelationLab'
import TeleportationPanel from './components/TeleportationPanel'
import Scene from './components/Scene'
import { level1MissionConsole } from './content/level1ObservationLog'
import { JourneyProvider } from './state/JourneyProvider'
import { useJourney } from './state/journeyContext'
import { useQubitController } from './hooks/useQubitController'
import { useCNOTSequence } from './hooks/useCNOTSequence'
import { useBellPreparationSequence } from './hooks/useBellPreparationSequence'
import { useTeleportationSequence } from './hooks/useTeleportationSequence'
import { discoveryReadoutTwoQubits } from './lib/discoveryReadout'
import {
  bellCorrelationDiscovery,
  buildBellAmplitudes,
  correlationPatternFromOutcomes,
  correlationStats,
  getBellState,
  type BellStateId,
} from './lib/bellStates'
import {
  compositeFromAmplitudes,
  isApproximatelyEntangled,
  reducedBlochVector,
  sampleComputationalBasisMeasurement,
  sampleJointMeasurement,
} from './lib/twoQubitState'
import type { TwoQubitAmplitudes } from './lib/twoQubitState'
import type { QubitId } from './lib/qubitId'
import {
  createMeasurementRecord,
  type MeasurementRecord,
} from './lib/measurementHistory'
import {
  createBellCorrelationExperimentRecord,
  createBellMeasurementRecord,
  type GateOperationRecord,
} from './lib/gateOperationHistory'
import type { MeasurementResult } from './hooks/useMeasurementSequence'
import { easeInOutCubic } from './lib/easing'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BellExperimentTrial } from './components/BellStatePreparationPanel'

const MOBILE_EDU_CARD_DELAY_MS = 2000
const MOBILE_LAYOUT_MQ = '(max-width: 767.98px)'
const JOINT_COLLAPSE_MS = 550
const JOINT_PARTNER_DELAY_MS = 280
const BELL_TRIAL_LIMIT = 20
const BELL_DISCOVERY_AFTER = 3
const BELL_EDU_AFTER = 5
const BELL_RESTORE_DELAY_MS = 650
const BELL_EDU_DELAY_MS = 1200
const CORR_BATCH_SIZE = 10
const CORR_TRIAL_GAP_MS = 140
const CORR_HIGHLIGHT_MS = 320
const CORR_EDU_DELAY_MS = 900
const CORR_TRIAL_LIMIT = 40

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
  const [cnotDiscovery, setCnotDiscovery] = useState<string[] | null>(null)
  const [jointMeasurementResult, setJointMeasurementResult] =
    useState<MeasurementResult | null>(null)
  const [jointMeasurementHistory, setJointMeasurementHistory] = useState<
    MeasurementRecord[]
  >([])
  const [jointMeasurePulse, setJointMeasurePulse] = useState({ A: 0, B: 0 })
  const [jointMeasureBusy, setJointMeasureBusy] = useState(false)
  const jointMeasurementCountRef = useRef(0)
  const jointMeasureRafRef = useRef<number | null>(null)
  const jointMeasureTimersRef = useRef<number[]>([])

  const [cnotControl, setCnotControl] = useState<QubitId>('A')
  const [cnotTarget, setCnotTarget] = useState<QubitId>('B')
  const [bellSelected, setBellSelected] = useState<BellStateId>('phi+')
  const [entanglementBoost, setEntanglementBoost] = useState(0)
  const [preparedBellId, setPreparedBellId] = useState<BellStateId | null>(
    null,
  )
  const [bellTrials, setBellTrials] = useState<BellExperimentTrial[]>([])
  const [bellMeasureHistory, setBellMeasureHistory] = useState<
    GateOperationRecord[]
  >([])
  const [bellPlaygroundReadout, setBellPlaygroundReadout] = useState<{
    title: string
    body: string[]
  } | null>(null)
  const [corrTrials, setCorrTrials] = useState<CorrelationTrial[]>([])
  const [corrHistory, setCorrHistory] = useState<GateOperationRecord[]>([])
  const [corrBusy, setCorrBusy] = useState(false)
  const [corrEduReadout, setCorrEduReadout] = useState<{
    title: string
    body: string[]
  } | null>(null)
  const bellTrialCountRef = useRef(0)
  const bellEduShownRef = useRef(false)
  const bellRestoreTimerRef = useRef<number | null>(null)
  const corrEduShownRef = useRef(false)
  const corrBatchCountRef = useRef(0)
  const corrTimersRef = useRef<number[]>([])
  const corrCancelledRef = useRef(false)

  // While CNOT runs, angle tweens must not wipe the joint vector.
  // After CNOT commits angles + amplitudes, skip one product resync.
  const skipNextProductSyncRef = useRef(false)
  const cnotBusyRef = useRef(false)
  const qubitBusyRef = useRef({ A: false, B: false })

  const onJointAmps = useCallback((amps: TwoQubitAmplitudes) => {
    skipNextProductSyncRef.current = true
    setJointAmps(amps)
  }, [])

  const onCnotDiscovery = useCallback((message: string | string[]) => {
    setCnotDiscovery(Array.isArray(message) ? message : [message])
  }, [])

  useEffect(() => {
    return () => {
      if (jointMeasureRafRef.current != null) {
        cancelAnimationFrame(jointMeasureRafRef.current)
      }
      for (const id of jointMeasureTimersRef.current) window.clearTimeout(id)
      if (bellRestoreTimerRef.current != null) {
        window.clearTimeout(bellRestoreTimerRef.current)
      }
      for (const id of corrTimersRef.current) window.clearTimeout(id)
    }
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

  cnotBusyRef.current = cnotBusy
  qubitBusyRef.current = {
    A: qubitA.controlsLocked,
    B: qubitB.controlsLocked,
  }

  const onLinkBoost = useCallback(() => {
    setEntanglementBoost(1)
    const started = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      setEntanglementBoost(1 - t)
      if (t < 1) requestAnimationFrame(tick)
      else setEntanglementBoost(0)
    }
    requestAnimationFrame(tick)
  }, [])

  const {
    prepareBellState,
    busy: bellPrepBusy,
    readout: bellReadout,
    dismissReadout: dismissBellReadout,
    gateHistory: bellHistory,
  } = useBellPreparationSequence({
    enabled:
      playground &&
      !qubitA.controlsLocked &&
      !qubitB.controlsLocked &&
      !cnotBusy &&
      !jointMeasureBusy,
    applyH: (qubit, options) => {
      if (qubit === 'A') qubitA.applyH(options)
      else qubitB.applyH(options)
    },
    applyZ: (qubit, options) => {
      if (qubit === 'A') qubitA.applyZ(options)
      else qubitB.applyZ(options)
    },
    applyCNOT,
    isQubitBusy: (qubit) => qubitBusyRef.current[qubit],
    isCnotBusy: () => cnotBusyRef.current,
    thetaA: qubitA.theta,
    phiA: qubitA.phi,
    thetaB: qubitB.theta,
    phiB: qubitB.phi,
    setAnglesA: qubitA.setAngles,
    setAnglesB: qubitB.setAngles,
    jointAmps,
    onJointAmps,
    clearJointAmps: () => setJointAmps(null),
    onDiscovery: onCnotDiscovery,
    onPrepared: setPreparedBellId,
    onLinkBoost,
  })

  const onTeleportDiscovery = useCallback((message: string | string[]) => {
    if (Array.isArray(message) && message.length === 0) {
      setCnotDiscovery(null)
      return
    }
    setCnotDiscovery(Array.isArray(message) ? message : [message])
  }, [])

  const {
    active: teleportActive,
    busy: teleportBusy,
    scene: teleportScene,
    classicalBits: teleportClassicalBits,
    readout: teleportReadout,
    dismissReadout: dismissTeleportReadout,
    gateHistory: teleportHistory,
    startTeleportation,
    resetTeleport,
  } = useTeleportationSequence({
    enabled:
      playground &&
      !qubitA.controlsLocked &&
      !qubitB.controlsLocked &&
      !cnotBusy &&
      !jointMeasureBusy &&
      !bellPrepBusy,
    learnerTheta: qubitA.theta,
    learnerPhi: qubitA.phi,
    onDiscovery: onTeleportDiscovery,
  })

  const entangled = useMemo(
    () => (jointAmps ? isApproximatelyEntangled(jointAmps) : false),
    [jointAmps],
  )

  const measureJointQubit = useCallback(
    (measured: QubitId) => {
      if (
        !jointAmps ||
        cnotBusy ||
        jointMeasureBusy ||
        bellPrepBusy ||
        teleportBusy ||
        qubitA.controlsLocked ||
        qubitB.controlsLocked
      ) {
        return
      }

      const wasEntangled = isApproximatelyEntangled(jointAmps)
      const sample = sampleJointMeasurement(jointAmps, measured)
      const collapsedA = reducedBlochVector(sample.collapsed, 'A')
      const collapsedB = reducedBlochVector(sample.collapsed, 'B')
      const measuredLabel = measured === 'A' ? qubitA.name : qubitB.name
      const correlatedLabel =
        sample.correlated === 'A' ? qubitA.name : qubitB.name
      const outcome = sample.outcome === 0 ? '|0⟩' : '|1⟩'
      const correlatedOutcome =
        sample.correlatedOutcome === 0 ? '|0⟩' : '|1⟩'

      const fromA = { theta: qubitA.theta, phi: qubitA.phi }
      const fromB = { theta: qubitB.theta, phi: qubitB.phi }
      const toMeasured = measured === 'A' ? collapsedA : collapsedB
      const toPartner = measured === 'A' ? collapsedB : collapsedA
      const fromMeasured = measured === 'A' ? fromA : fromB
      const fromPartner = measured === 'A' ? fromB : fromA
      const setMeasuredAngles =
        measured === 'A' ? qubitA.setAngles : qubitB.setAngles
      const setPartnerAngles =
        measured === 'A' ? qubitB.setAngles : qubitA.setAngles

      if (jointMeasureRafRef.current != null) {
        cancelAnimationFrame(jointMeasureRafRef.current)
      }
      for (const id of jointMeasureTimersRef.current) window.clearTimeout(id)
      jointMeasureTimersRef.current = []

      setJointMeasureBusy(true)
      setJointMeasurementResult(null)
      setJointMeasurePulse(
        measured === 'A' ? { A: 1, B: 0 } : { A: 0, B: 1 },
      )

      const animateAngles = (
        from: { theta: number; phi: number },
        to: { theta: number; phi: number },
        setAngles: (theta: number, phi: number) => void,
        onDone: () => void,
      ) => {
        const started = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - started) / JOINT_COLLAPSE_MS)
          const eased = easeInOutCubic(t)
          setAngles(
            from.theta + (to.theta - from.theta) * eased,
            from.phi + (to.phi - from.phi) * eased,
          )
          if (t < 1) {
            jointMeasureRafRef.current = requestAnimationFrame(tick)
            return
          }
          jointMeasureRafRef.current = null
          onDone()
        }
        jointMeasureRafRef.current = requestAnimationFrame(tick)
      }

      const finish = () => {
        skipNextProductSyncRef.current = true
        qubitA.setAngles(collapsedA.theta, collapsedA.phi)
        qubitB.setAngles(collapsedB.theta, collapsedB.phi)
        onJointAmps(sample.collapsed)

        if (wasEntangled) {
          setCnotDiscovery([
            'Measuring one qubit also determined the state of the other.',
          ])
        } else {
          setCnotDiscovery([`Measured ${measuredLabel}: ${outcome}.`])
        }

        setJointMeasurementResult({
          outcome,
          percent0: sample.probabilityZero,
          percent1: sample.probabilityOne,
          registerLabel: measuredLabel,
          correlatedRegisterLabel: wasEntangled ? correlatedLabel : null,
          correlatedOutcome: wasEntangled ? correlatedOutcome : null,
        })

        jointMeasurementCountRef.current += 1
        const record = createMeasurementRecord({
          index: jointMeasurementCountRef.current,
          probabilityZero: sample.probabilityZero,
          probabilityOne: sample.probabilityOne,
          measuredState: outcome,
          registerLabel: measuredLabel,
          correlatedRegisterLabel: wasEntangled ? correlatedLabel : null,
          correlatedMeasuredState: wasEntangled ? correlatedOutcome : null,
        })
        setJointMeasurementHistory((prev) => [...prev, record])
        setJointMeasureBusy(false)
        setJointMeasurePulse({ A: 0, B: 0 })
      }

      animateAngles(fromMeasured, toMeasured, setMeasuredAngles, () => {
        if (!wasEntangled) {
          skipNextProductSyncRef.current = true
          setPartnerAngles(toPartner.theta, toPartner.phi)
          finish()
          return
        }

        setJointMeasurePulse(
          measured === 'A' ? { A: 0.35, B: 1 } : { A: 1, B: 0.35 },
        )
        const partnerId = window.setTimeout(() => {
          animateAngles(fromPartner, toPartner, setPartnerAngles, finish)
        }, JOINT_PARTNER_DELAY_MS)
        jointMeasureTimersRef.current.push(partnerId)
      })
    },
    [
      cnotBusy,
      jointAmps,
      jointMeasureBusy,
      bellPrepBusy,
      teleportBusy,
      onJointAmps,
      qubitA,
      qubitB,
    ],
  )

  const restorePreparedBell = useCallback(
    (id: BellStateId) => {
      const amps = buildBellAmplitudes(id)
      const a = reducedBlochVector(amps, 'A')
      const b = reducedBlochVector(amps, 'B')
      skipNextProductSyncRef.current = true
      qubitA.setAngles(a.theta, a.phi)
      qubitB.setAngles(b.theta, b.phi)
      onJointAmps(amps)
    },
    [onJointAmps, qubitA, qubitB],
  )

  const measureBellState = useCallback(() => {
    if (
      !jointAmps ||
      !preparedBellId ||
      cnotBusy ||
      jointMeasureBusy ||
      bellPrepBusy ||
      corrBusy ||
      qubitA.controlsLocked ||
      qubitB.controlsLocked
    ) {
      return
    }

    const bellId = preparedBellId
    const bellLabel = getBellState(bellId).label
    const sample = sampleComputationalBasisMeasurement(jointAmps)
    const collapsedA = reducedBlochVector(sample.collapsed, 'A')
    const collapsedB = reducedBlochVector(sample.collapsed, 'B')
    const fromA = { theta: qubitA.theta, phi: qubitA.phi }
    const fromB = { theta: qubitB.theta, phi: qubitB.phi }

    if (jointMeasureRafRef.current != null) {
      cancelAnimationFrame(jointMeasureRafRef.current)
    }
    for (const id of jointMeasureTimersRef.current) window.clearTimeout(id)
    jointMeasureTimersRef.current = []
    if (bellRestoreTimerRef.current != null) {
      window.clearTimeout(bellRestoreTimerRef.current)
      bellRestoreTimerRef.current = null
    }

    setJointMeasureBusy(true)
    setJointMeasurementResult(null)
    setJointMeasurePulse({ A: 1, B: 1 })

    const started = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / JOINT_COLLAPSE_MS)
      const eased = easeInOutCubic(t)
      qubitA.setAngles(
        fromA.theta + (collapsedA.theta - fromA.theta) * eased,
        fromA.phi + (collapsedA.phi - fromA.phi) * eased,
      )
      qubitB.setAngles(
        fromB.theta + (collapsedB.theta - fromB.theta) * eased,
        fromB.phi + (collapsedB.phi - fromB.phi) * eased,
      )
      if (t < 1) {
        jointMeasureRafRef.current = requestAnimationFrame(tick)
        return
      }
      jointMeasureRafRef.current = null

      skipNextProductSyncRef.current = true
      qubitA.setAngles(collapsedA.theta, collapsedA.phi)
      qubitB.setAngles(collapsedB.theta, collapsedB.phi)
      onJointAmps(sample.collapsed)

      bellTrialCountRef.current += 1
      const trial = bellTrialCountRef.current

      setBellTrials((prev) => {
        const next = [...prev, { trial, result: sample.bits }]
        return next.length > BELL_TRIAL_LIMIT
          ? next.slice(next.length - BELL_TRIAL_LIMIT)
          : next
      })

      setBellMeasureHistory((prev) => [
        ...prev,
        createBellMeasurementRecord({
          index: trial,
          bellLabel,
          outcome: sample.bits,
        }),
      ])

      setJointMeasurementResult({
        outcome: `|${sample.bits}⟩`,
        percent0: Math.round(sample.probabilities[0]! * 100),
        percent1: Math.round(
          (sample.probabilities[1]! +
            sample.probabilities[2]! +
            sample.probabilities[3]!) *
            100,
        ),
        registerLabel: `Bell ${bellLabel}`,
        correlatedRegisterLabel: null,
        correlatedOutcome: null,
      })

      if (trial >= BELL_DISCOVERY_AFTER) {
        setCnotDiscovery(bellCorrelationDiscovery(bellId))
      }

      if (trial >= BELL_EDU_AFTER && !bellEduShownRef.current) {
        bellEduShownRef.current = true
        window.setTimeout(() => {
          setBellPlaygroundReadout({
            title: 'Bell Playground',
            body: [
              'Individual outcomes appear random.',
              'The interesting part is not the individual measurements, but the relationship between them.',
              'Different Bell states produce different patterns of correlation.',
              'Those correlations are one of the defining features of quantum entanglement.',
            ],
          })
        }, BELL_EDU_DELAY_MS)
      }

      setJointMeasurePulse({ A: 0, B: 0 })
      setJointMeasureBusy(false)

      // Reprepare the same Bell state so the next trial samples a fresh entangled state.
      bellRestoreTimerRef.current = window.setTimeout(() => {
        restorePreparedBell(bellId)
        bellRestoreTimerRef.current = null
      }, BELL_RESTORE_DELAY_MS)
    }

    jointMeasureRafRef.current = requestAnimationFrame(tick)
  }, [
    bellPrepBusy,
    cnotBusy,
    jointAmps,
    jointMeasureBusy,
    onJointAmps,
    preparedBellId,
    qubitA,
    qubitB,
    restorePreparedBell,
  ])

  const resetBellExperiment = useCallback(() => {
    if (bellRestoreTimerRef.current != null) {
      window.clearTimeout(bellRestoreTimerRef.current)
      bellRestoreTimerRef.current = null
    }
    bellTrialCountRef.current = 0
    bellEduShownRef.current = false
    setBellTrials([])
    setBellMeasureHistory([])
    setJointMeasurementResult(null)
    setBellPlaygroundReadout(null)
    setCnotDiscovery(null)
  }, [])

  const corrStats = useMemo(() => correlationStats(corrTrials), [corrTrials])

  const clearCorrelationLab = useCallback(() => {
    corrCancelledRef.current = true
    for (const id of corrTimersRef.current) window.clearTimeout(id)
    corrTimersRef.current = []
    setCorrBusy(false)
    setCorrTrials([])
    setCorrEduReadout(null)
    corrEduShownRef.current = false
  }, [])

  const runCorrelationBatch = useCallback(() => {
    if (
      !preparedBellId ||
      corrBusy ||
      cnotBusy ||
      jointMeasureBusy ||
      bellPrepBusy ||
      teleportBusy ||
      qubitA.controlsLocked ||
      qubitB.controlsLocked
    ) {
      return
    }

    const bellId = preparedBellId
    const bellLabel = getBellState(bellId).label
    corrCancelledRef.current = false
    setCorrBusy(true)

    const batchResults: { alice: 0 | 1; bob: 0 | 1 }[] = []

    const runOne = (i: number) => {
      if (corrCancelledRef.current) {
        setCorrBusy(false)
        return
      }

      // Genuine sample from the prepared Bell amplitudes (same restoration source).
      const amps = buildBellAmplitudes(bellId)
      const sample = sampleComputationalBasisMeasurement(amps)
      const alice = sample.outcomeA
      const bob = sample.outcomeB
      batchResults.push({ alice, bob })

      const id = `corr-${Date.now()}-${i}-${sample.bits}`
      setCorrTrials((prev) => {
        const next: CorrelationTrial[] = [
          ...prev.map((t) => ({ ...t, highlight: false })),
          { id, alice, bob, highlight: true },
        ]
        return next.length > CORR_TRIAL_LIMIT
          ? next.slice(next.length - CORR_TRIAL_LIMIT)
          : next
      })

      // Brief pulse so the learner sees each trial land.
      setJointMeasurePulse({ A: 0.55, B: 0.55 })
      const pulseOff = window.setTimeout(() => {
        setJointMeasurePulse({ A: 0, B: 0 })
      }, CORR_HIGHLIGHT_MS)
      corrTimersRef.current.push(pulseOff)

      const clearFlash = window.setTimeout(() => {
        setCorrTrials((prev) =>
          prev.map((t) => (t.id === id ? { ...t, highlight: false } : t)),
        )
      }, CORR_HIGHLIGHT_MS + 80)
      corrTimersRef.current.push(clearFlash)

      // Restore Bell state after every measurement (Bell Playground path).
      restorePreparedBell(bellId)

      if (i + 1 < CORR_BATCH_SIZE) {
        const nextId = window.setTimeout(() => runOne(i + 1), CORR_TRIAL_GAP_MS)
        corrTimersRef.current.push(nextId)
        return
      }

      // Batch complete — stats from actual outcomes.
      const pattern = correlationPatternFromOutcomes(batchResults)
      if (pattern) setCnotDiscovery(pattern)

      const batchStats = correlationStats(batchResults)
      corrBatchCountRef.current += 1
      setCorrHistory((prev) => [
        ...prev,
        createBellCorrelationExperimentRecord({
          index: corrBatchCountRef.current,
          bellLabel,
          trials: batchResults.length,
          agreementPercent: batchStats.agreementPercent,
          oppositePercent: batchStats.oppositePercent,
        }),
      ])

      if (!corrEduShownRef.current) {
        corrEduShownRef.current = true
        const eduId = window.setTimeout(() => {
          setCorrEduReadout({
            title: 'Bell Correlation Lab',
            body: [
              'Bell states are not defined only by entanglement.',
              'They are also distinguished by how measurement outcomes are correlated.',
              'Some Bell states always produce matching results.',
              'Others always produce opposite results.',
              'The correlation emerges from repeated experiments rather than a single measurement.',
            ],
          })
        }, CORR_EDU_DELAY_MS)
        corrTimersRef.current.push(eduId)
      }

      setCorrBusy(false)
    }

    // Ensure we start from a fresh prepared Bell pair.
    restorePreparedBell(bellId)
    const startId = window.setTimeout(() => runOne(0), 60)
    corrTimersRef.current.push(startId)
  }, [
    bellPrepBusy,
    cnotBusy,
    corrBusy,
    jointMeasureBusy,
    preparedBellId,
    qubitA.controlsLocked,
    qubitB.controlsLocked,
    restorePreparedBell,
    teleportBusy,
  ])

  useEffect(() => {
    if (
      cnotBusy ||
      jointMeasureBusy ||
      bellPrepBusy ||
      teleportBusy ||
      corrBusy
    ) {
      return
    }
    if (skipNextProductSyncRef.current) {
      skipNextProductSyncRef.current = false
      return
    }
    setJointAmps(null)
    setPreparedBellId(null)
  }, [
    qubitA.theta,
    qubitA.phi,
    qubitB.theta,
    qubitB.phi,
    cnotBusy,
    jointMeasureBusy,
    bellPrepBusy,
    teleportBusy,
    corrBusy,
  ])

  const gateReadout =
    bellPrepBusy || teleportBusy || corrBusy
      ? null
      : corrEduReadout ??
        teleportReadout ??
        bellPlaygroundReadout ??
        bellReadout ??
        cnotReadout ??
        qubitA.gateReadout ??
        qubitB.gateReadout
  const dismissGateReadout = corrEduReadout
    ? () => setCorrEduReadout(null)
    : teleportReadout
      ? dismissTeleportReadout
      : bellPlaygroundReadout
        ? () => setBellPlaygroundReadout(null)
        : bellReadout
          ? dismissBellReadout
          : cnotReadout
            ? dismissCnotReadout
            : qubitA.gateReadout
              ? qubitA.dismissGateReadout
              : qubitB.dismissGateReadout

  const result = jointMeasurementResult ?? qubitA.result ?? qubitB.result
  const dismissResult = jointMeasurementResult
    ? () => setJointMeasurementResult(null)
    : qubitA.result
      ? qubitA.dismissResult
      : qubitB.dismissResult

  const gateHistory = useMemo(
    () => [
      ...qubitA.gateHistory,
      ...qubitB.gateHistory,
      ...cnotHistory,
      ...bellHistory,
      ...bellMeasureHistory,
      ...corrHistory,
      ...teleportHistory,
    ],
    [
      qubitA.gateHistory,
      qubitB.gateHistory,
      cnotHistory,
      bellHistory,
      bellMeasureHistory,
      corrHistory,
      teleportHistory,
    ],
  )

  const measurementHistory = useMemo(
    () => [
      ...qubitA.measurementHistory,
      ...qubitB.measurementHistory,
      ...jointMeasurementHistory,
    ],
    [
      jointMeasurementHistory,
      qubitA.measurementHistory,
      qubitB.measurementHistory,
    ],
  )

  const discoveryLines = useMemo(() => {
    const base = discoveryReadoutTwoQubits(
      { label: qubitA.name, theta: qubitA.theta },
      { label: qubitB.name, theta: qubitB.theta },
    )
    if (cnotDiscovery) return [...cnotDiscovery, ...base]
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
          jointMeasurePulse.A ||
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
          jointMeasurePulse.B ||
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
      jointMeasurePulse.A,
      qubitB.id,
      qubitB.name,
      qubitB.theta,
      qubitB.phi,
      qubitB.pulse,
      qubitB.phaseAngle,
      qubitB.phasePulse,
      jointMeasurePulse.B,
      cnotPulse,
    ],
  )

  const controlsLocked =
    qubitA.controlsLocked ||
    qubitB.controlsLocked ||
    cnotBusy ||
    jointMeasureBusy ||
    bellPrepBusy ||
    teleportBusy ||
    corrBusy

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
          qubits={playground && !teleportActive ? sceneQubits : null}
          stackVertical={mobileLayout}
          entangled={entangled || Boolean(cnotPulse) || bellPrepBusy}
          entanglementBoost={entanglementBoost}
          teleport={teleportActive && teleportScene ? teleportScene : null}
        />
      </section>

      <LandingOverlay onBeginJourney={beginJourney} hidden={phase !== 'landing'} />

      {playground ? (
        <div className="instrument-shelf instrument-shelf--dual scrollbar-quantum">
          <QubitInstrument
            qubit={qubitA}
            locked={
              cnotBusy ||
              bellPrepBusy ||
              jointMeasureBusy ||
              teleportBusy ||
              corrBusy
            }
            onMeasureOverride={jointAmps ? () => measureJointQubit('A') : undefined}
          />
          <QubitInstrument
            qubit={qubitB}
            locked={
              cnotBusy ||
              bellPrepBusy ||
              jointMeasureBusy ||
              teleportBusy ||
              corrBusy
            }
            onMeasureOverride={jointAmps ? () => measureJointQubit('B') : undefined}
          />
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
          <BellStatePreparationPanel
            selected={bellSelected}
            onSelect={setBellSelected}
            onPrepare={() => prepareBellState(bellSelected)}
            onMeasureBell={measureBellState}
            onResetExperiment={resetBellExperiment}
            canMeasureBell={
              Boolean(preparedBellId && jointAmps && entangled)
            }
            trials={bellTrials}
            disabled={controlsLocked}
          />
          <BellCorrelationLab
            selectedBell={preparedBellId ?? bellSelected}
            trials={corrTrials}
            agreementPercent={corrStats.agreementPercent}
            oppositePercent={corrStats.oppositePercent}
            onRunBatch={runCorrelationBatch}
            onClear={clearCorrelationLab}
            canRun={Boolean(preparedBellId)}
            running={corrBusy}
            disabled={controlsLocked && !corrBusy}
          />
          <TeleportationPanel
            classicalBits={teleportClassicalBits}
            onStart={startTeleportation}
            onReset={resetTeleport}
            disabled={controlsLocked}
            busy={teleportBusy}
            active={teleportActive}
          />
          <CompositeStatePanel
            thetaA={qubitA.theta}
            thetaB={qubitB.theta}
            compositeOverride={compositeOverride}
            entangled={entangled}
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

import { useMemo } from 'react'
import { useQubitState } from './useQubitState'
import { usePhaseLayer } from './usePhaseLayer'
import { useMeasurementSequence } from './useMeasurementSequence'
import { useHGateSequence } from './useHGateSequence'
import { useXGateSequence } from './useXGateSequence'
import { useYGateSequence } from './useYGateSequence'
import { useZGateSequence } from './useZGateSequence'
import { useSGateSequence } from './useSGateSequence'
import { useTGateSequence } from './useTGateSequence'
import { qubitStateLabel } from '../lib/qubitState'
import {
  qubitDisplayName,
  type QubitId,
} from '../lib/qubitId'
import type { GateOperationRecord } from '../lib/gateOperationHistory'
import type { MeasurementRecord } from '../lib/measurementHistory'

export type QubitGateReadout = {
  title: string
  body: string[]
}

/**
 * One independent qubit instrument: state, phase layer, gates, measurement.
 * Designed so a future composite two-qubit state can wrap these controllers.
 */
export function useQubitController(id: QubitId, playground: boolean) {
  const name = qubitDisplayName(id)
  const { theta, phi, setTheta, setPhi, setAngles } = useQubitState()
  const {
    phase: phaseAngle,
    pulse: phasePulse,
    animatePhaseAdvance,
  } = usePhaseLayer()

  const {
    applyH,
    busy: hBusy,
    glowing: hGlowing,
    readout: hReadout,
    dismissReadout: dismissHReadout,
    gateHistory: hHistory,
  } = useHGateSequence({
    theta,
    phi,
    setAngles,
    enabled: playground,
  })

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
    enabled: playground && !hBusy,
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
    enabled: playground && !hBusy && !xBusy,
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
    enabled: playground && !hBusy && !xBusy && !yBusy,
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
    enabled: playground && !hBusy && !xBusy && !yBusy && !zBusy,
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
    enabled: playground && !hBusy && !xBusy && !yBusy && !zBusy && !sBusy,
    animatePhaseAdvance,
  })

  const gateBusy = hBusy || xBusy || yBusy || zBusy || sBusy || tBusy
  const phaseNotice = tPhaseNotice ?? sPhaseNotice ?? zPhaseNotice

  const rawGateReadout =
    tReadout ?? sReadout ?? yReadout ?? zReadout ?? xReadout ?? hReadout
  const dismissGateReadout = tReadout
    ? dismissTReadout
    : sReadout
      ? dismissSReadout
      : yReadout
        ? dismissYReadout
        : zReadout
          ? dismissZReadout
          : xReadout
            ? dismissXReadout
            : dismissHReadout

  const gateReadout: QubitGateReadout | null = useMemo(() => {
    if (!rawGateReadout) return null
    return {
      title: rawGateReadout.title,
      body: [`Applied to ${name}.`, ...rawGateReadout.body],
    }
  }, [rawGateReadout, name])

  const gateHistory: GateOperationRecord[] = useMemo(
    () =>
      [...hHistory, ...xHistory, ...yHistory, ...zHistory, ...sHistory, ...tHistory].map(
        (record) => ({
          ...record,
          registerLabel: name,
        }),
      ),
    [hHistory, xHistory, yHistory, zHistory, sHistory, tHistory, name],
  )

  const { measure, busy: measureBusy, pulse, result, dismissResult, history } =
    useMeasurementSequence({
      theta,
      setTheta,
      enabled: playground && !gateBusy,
      registerLabel: name,
    })

  const measurementHistory: MeasurementRecord[] = history

  const resultWithLabel = useMemo(() => {
    if (!result) return null
    return { ...result, registerLabel: name }
  }, [result, name])

  const stateLabel = useMemo(() => qubitStateLabel(theta), [theta])
  const controlsLocked = measureBusy || gateBusy

  return {
    id,
    name,
    theta,
    phi,
    setTheta,
    setPhi,
    setAngles,
    stateLabel,
    phaseAngle,
    phasePulse,
    phaseNotice,
    applyH,
    applyX,
    applyY,
    applyZ,
    applyS,
    applyT,
    measure,
    hGlowing,
    xGlowing,
    yGlowing,
    zGlowing,
    sGlowing,
    tGlowing,
    pulse,
    result: resultWithLabel,
    dismissResult,
    gateReadout,
    dismissGateReadout,
    gateHistory,
    measurementHistory,
    controlsLocked,
  }
}

export type QubitController = ReturnType<typeof useQubitController>

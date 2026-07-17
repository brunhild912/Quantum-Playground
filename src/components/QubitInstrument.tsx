import type { QubitController } from '../hooks/useQubitController'
import ProbabilityPanel from './ProbabilityPanel'
import ControlPanel from './ControlPanel'
import MeasureButton from './MeasureButton'

type QubitInstrumentProps = {
  qubit: QubitController
}

/**
 * Per-qubit instrument column: probability, state sliders, and gate dock.
 * Reuses existing panels — no duplicated quantum logic.
 */
export default function QubitInstrument({ qubit }: QubitInstrumentProps) {
  return (
    <section
      className="qubit-instrument"
      aria-label={`${qubit.name} controls`}
    >
      <header className="qubit-instrument-header">
        <h2 className="qubit-instrument-title">{qubit.name}</h2>
      </header>

      <ProbabilityPanel theta={qubit.theta} notice={qubit.phaseNotice} />

      <ControlPanel
        stateLabel={qubit.stateLabel}
        theta={qubit.theta}
        phi={qubit.phi}
        onThetaChange={qubit.setTheta}
        onPhiChange={qubit.setPhi}
      />

      <MeasureButton
        onMeasure={qubit.measure}
        onXGate={qubit.applyX}
        onYGate={qubit.applyY}
        onZGate={qubit.applyZ}
        onSGate={qubit.applyS}
        onTGate={qubit.applyT}
        disabled={qubit.controlsLocked}
        xGlowing={qubit.xGlowing}
        yGlowing={qubit.yGlowing}
        zGlowing={qubit.zGlowing}
        sGlowing={qubit.sGlowing}
        tGlowing={qubit.tGlowing}
      />
    </section>
  )
}

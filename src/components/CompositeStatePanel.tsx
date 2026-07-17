import { useMemo } from 'react'
import {
  compositeFromIndependentQubits,
  type CompositeQuantumState,
} from '../lib/compositeQuantumState'

const SEGMENT_COUNT = 10

type CompositeStatePanelProps = {
  thetaA: number
  thetaB: number
  /** When set (e.g. after CNOT), shows vector-based joint probabilities. */
  compositeOverride?: CompositeQuantumState | null
}

function segmentCount(percent: number): number {
  return Math.min(
    SEGMENT_COUNT,
    Math.max(0, Math.round(percent / (100 / SEGMENT_COUNT))),
  )
}

function ProbabilitySegments({
  percent,
  label,
}: {
  percent: number
  label: string
}) {
  const filled = segmentCount(percent)

  return (
    <div
      className="probability-panel-segments"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
        <span
          key={i}
          className={
            i < filled
              ? 'probability-panel-segment probability-panel-segment--filled'
              : 'probability-panel-segment'
          }
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/**
 * Level 7B — live joint probabilities for two independent qubits.
 * UI stays reusable when the composite model later becomes a full state vector.
 */
export default function CompositeStatePanel({
  thetaA,
  thetaB,
  compositeOverride = null,
}: CompositeStatePanelProps) {
  const composite = useMemo(
    () => compositeOverride ?? compositeFromIndependentQubits(thetaA, thetaB),
    [compositeOverride, thetaA, thetaB],
  )

  return (
    <aside
      className="composite-state-panel"
      role="region"
      aria-label="Composite quantum system"
    >
      <header className="composite-state-panel-header">
        <h2 className="composite-state-panel-title">Composite Quantum System</h2>
      </header>

      <div className="composite-state-panel-rule" aria-hidden="true" />

      <div className="composite-state-panel-rows">
        {composite.entries.map((entry) => (
          <div key={entry.basis} className="probability-panel-row">
            <span className="probability-panel-ket">{entry.ket}</span>
            <ProbabilitySegments
              percent={entry.percent}
              label={`Probability of measuring ${entry.ket}`}
            />
            <span className="probability-panel-percent">{entry.percent}%</span>
          </div>
        ))}
      </div>

      <div className="composite-state-insight" aria-label="State space insight">
        <p className="composite-state-insight-title">Did you know?</p>
        <div className="composite-state-insight-grid">
          <div className="composite-state-insight-col">
            <span>1 qubit</span>
            <span className="composite-state-insight-arrow" aria-hidden="true">
              ↓
            </span>
            <span>2 states</span>
            <span className="composite-state-insight-meta">2¹</span>
          </div>
          <div className="composite-state-insight-col">
            <span>2 qubits</span>
            <span className="composite-state-insight-arrow" aria-hidden="true">
              ↓
            </span>
            <span>4 states</span>
            <span className="composite-state-insight-meta">2²</span>
          </div>
          <div className="composite-state-insight-col composite-state-insight-col--prompt">
            <span>3 qubits?</span>
            <span className="composite-state-insight-arrow" aria-hidden="true">
              ↓
            </span>
            <span>8 states</span>
            <span className="composite-state-insight-meta">2³</span>
          </div>
          <div className="composite-state-insight-col composite-state-insight-col--prompt">
            <span>10 qubits?</span>
            <span className="composite-state-insight-arrow" aria-hidden="true">
              ↓
            </span>
            <span>1024 states</span>
            <span className="composite-state-insight-meta">2¹⁰</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

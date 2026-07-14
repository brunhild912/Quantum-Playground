import { useMemo } from 'react'
import { measurementProbabilities } from '../lib/qubitProbability'

const SEGMENT_COUNT = 10

type ProbabilityPanelProps = {
  theta: number
  /** Brief educational cue (e.g. after a phase gate). */
  notice?: string | null
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

export default function ProbabilityPanel({
  theta,
  notice = null,
}: ProbabilityPanelProps) {
  const { percent0, percent1 } = useMemo(
    () => measurementProbabilities(theta),
    [theta],
  )

  return (
    <aside
      className="probability-panel"
      role="region"
      aria-label="Measurement probability"
    >
      <h2 className="probability-panel-title">Probability</h2>
      <div className="probability-panel-rule" aria-hidden="true" />

      <div className="probability-panel-row">
        <span className="probability-panel-ket">|0⟩</span>
        <ProbabilitySegments
          percent={percent0}
          label="Probability of measuring zero"
        />
        <span className="probability-panel-percent">{percent0}%</span>
      </div>

      <div className="probability-panel-row">
        <span className="probability-panel-ket">|1⟩</span>
        <ProbabilitySegments
          percent={percent1}
          label="Probability of measuring one"
        />
        <span className="probability-panel-percent">{percent1}%</span>
      </div>

      {notice ? (
        <p className="probability-panel-notice" role="status">
          {notice}
        </p>
      ) : null}
    </aside>
  )
}

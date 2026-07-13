import { useMemo } from 'react'
import { measurementProbabilities } from '../lib/qubitProbability'

type ProbabilityPanelProps = {
  theta: number
}

export default function ProbabilityPanel({ theta }: ProbabilityPanelProps) {
  const { percent0, percent1, p0, p1 } = useMemo(
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
        <div
          className="probability-panel-track"
          role="meter"
          aria-label="Probability of measuring zero"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent0}
        >
          <div
            className="probability-panel-fill"
            style={{ width: `${p0 * 100}%` }}
          />
        </div>
        <span className="probability-panel-percent">{percent0}%</span>
      </div>

      <div className="probability-panel-row">
        <span className="probability-panel-ket">|1⟩</span>
        <div
          className="probability-panel-track"
          role="meter"
          aria-label="Probability of measuring one"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent1}
        >
          <div
            className="probability-panel-fill"
            style={{ width: `${p1 * 100}%` }}
          />
        </div>
        <span className="probability-panel-percent">{percent1}%</span>
      </div>
    </aside>
  )
}

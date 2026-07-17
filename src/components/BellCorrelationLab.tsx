import { useState } from 'react'
import { getBellState, type BellStateId } from '../lib/bellStates'

export type CorrelationTrial = {
  id: string
  alice: 0 | 1
  bob: 0 | 1
  /** Briefly highlight when freshly added. */
  highlight?: boolean
}

type BellCorrelationLabProps = {
  selectedBell: BellStateId
  trials: CorrelationTrial[]
  agreementPercent: number
  oppositePercent: number
  onRunBatch: () => void
  onClear: () => void
  canRun?: boolean
  running?: boolean
  disabled?: boolean
}

/**
 * Level 7H — discover Bell-state correlations through repeated experiments.
 */
export default function BellCorrelationLab({
  selectedBell,
  trials,
  agreementPercent,
  oppositePercent,
  onRunBatch,
  onClear,
  canRun = false,
  running = false,
  disabled = false,
}: BellCorrelationLabProps) {
  const [open, setOpen] = useState(true)
  const label = getBellState(selectedBell).label
  const total = trials.length

  return (
    <aside
      className={`bell-corr-lab${open ? ' bell-corr-lab--open' : ''}`}
      role="region"
      aria-label="Bell correlation lab"
    >
      <button
        type="button"
        className="bell-corr-lab-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <h2 className="bell-corr-lab-title">Bell Correlation Lab</h2>
        <span className="bell-corr-lab-chevron" aria-hidden="true" />
      </button>

      {open ? (
        <div className="bell-corr-lab-body">
          <div className="bell-corr-lab-rule" aria-hidden="true" />

          <p className="bell-corr-lab-meta">
            <span className="bell-corr-lab-meta-label">Selected Bell State</span>
            <span className="bell-corr-lab-meta-value">{label}</span>
          </p>

          <p className="bell-corr-lab-section-label">Trials</p>
          {total === 0 ? (
            <p className="bell-corr-lab-empty">
              Prepare a Bell state, then run trials to observe correlations.
            </p>
          ) : (
            <div className="bell-corr-lab-table-wrap scrollbar-quantum">
              <table className="bell-corr-lab-table">
                <thead>
                  <tr>
                    <th scope="col">Alice</th>
                    <th scope="col">Bob</th>
                  </tr>
                </thead>
                <tbody>
                  {[...trials].reverse().map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.highlight
                          ? 'bell-corr-lab-row bell-corr-lab-row--flash'
                          : 'bell-corr-lab-row'
                      }
                    >
                      <td>{row.alice}</td>
                      <td>{row.bob}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bell-corr-lab-stats" aria-live="polite">
            <div className="bell-corr-lab-stat">
              <div className="bell-corr-lab-stat-head">
                <span>Agreement</span>
                <span>{agreementPercent}%</span>
              </div>
              <div
                className="bell-corr-lab-bar"
                role="meter"
                aria-label="Agreement"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={agreementPercent}
              >
                <span
                  className="bell-corr-lab-bar-fill"
                  style={{ width: `${agreementPercent}%` }}
                />
              </div>
            </div>

            <div className="bell-corr-lab-stat">
              <div className="bell-corr-lab-stat-head">
                <span>Opposite</span>
                <span>{oppositePercent}%</span>
              </div>
              <div
                className="bell-corr-lab-bar"
                role="meter"
                aria-label="Opposite"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={oppositePercent}
              >
                <span
                  className="bell-corr-lab-bar-fill bell-corr-lab-bar-fill--opp"
                  style={{ width: `${oppositePercent}%` }}
                />
              </div>
            </div>

            <p className="bell-corr-lab-total">
              Total Trials <strong>{total}</strong>
            </p>
          </div>

          <button
            type="button"
            className="quantum-action-btn bell-corr-lab-btn"
            onClick={onRunBatch}
            disabled={disabled || !canRun || running}
          >
            {running ? 'Running…' : 'Run 10 Trials'}
          </button>
          <button
            type="button"
            className="quantum-action-btn bell-corr-lab-btn bell-corr-lab-btn--secondary"
            onClick={onClear}
            disabled={disabled || running || total === 0}
          >
            Clear
          </button>
        </div>
      ) : null}
    </aside>
  )
}

import {
  BELL_STATES,
  type BellStateId,
} from '../lib/bellStates'

export type BellExperimentTrial = {
  trial: number
  result: string
}

type BellStatePreparationPanelProps = {
  selected: BellStateId
  onSelect: (id: BellStateId) => void
  onPrepare: () => void
  onMeasureBell: () => void
  onResetExperiment: () => void
  canMeasureBell?: boolean
  trials?: BellExperimentTrial[]
  disabled?: boolean
}

/**
 * Level 7E/7F — prepare a Bell state, then experiment with joint measurements.
 */
export default function BellStatePreparationPanel({
  selected,
  onSelect,
  onPrepare,
  onMeasureBell,
  onResetExperiment,
  canMeasureBell = false,
  trials = [],
  disabled = false,
}: BellStatePreparationPanelProps) {
  return (
    <aside
      className="bell-prep-panel"
      role="region"
      aria-label="Bell state preparation"
    >
      <header className="bell-prep-panel-header">
        <h2 className="bell-prep-panel-title">Bell State Preparation</h2>
      </header>

      <div className="bell-prep-panel-rule" aria-hidden="true" />

      <fieldset className="bell-prep-fieldset">
        <legend className="bell-prep-legend">Bell State</legend>
        {BELL_STATES.map((bell) => (
          <label key={bell.id} className="bell-prep-option">
            <input
              type="radio"
              name="bell-state"
              checked={selected === bell.id}
              onChange={() => onSelect(bell.id)}
              disabled={disabled}
            />
            <span className="bell-prep-option-label">{bell.label}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="quantum-action-btn bell-prep-apply"
        onClick={onPrepare}
        disabled={disabled}
      >
        Prepare Bell State
      </button>

      <div className="bell-prep-panel-rule" aria-hidden="true" />

      <div className="bell-playground-actions">
        <button
          type="button"
          className="quantum-action-btn bell-prep-apply"
          onClick={onMeasureBell}
          disabled={disabled || !canMeasureBell}
        >
          Measure Bell State
        </button>
        <button
          type="button"
          className="quantum-action-btn bell-prep-apply bell-prep-apply--secondary"
          onClick={onResetExperiment}
          disabled={disabled}
        >
          Reset Experiment
        </button>
      </div>

      <div className="bell-experiment" aria-label="Bell experiment history">
        <p className="bell-experiment-title">Bell Experiment</p>
        {trials.length === 0 ? (
          <p className="bell-experiment-empty">
            Prepare a Bell state, then measure to collect trials.
          </p>
        ) : (
          <table className="bell-experiment-table">
            <thead>
              <tr>
                <th scope="col">Trial</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {[...trials].reverse().map((row) => (
                <tr key={row.trial}>
                  <td>{row.trial}</td>
                  <td className="bell-experiment-result">{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </aside>
  )
}

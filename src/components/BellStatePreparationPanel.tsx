import {
  BELL_STATES,
  type BellStateId,
} from '../lib/bellStates'

type BellStatePreparationPanelProps = {
  selected: BellStateId
  onSelect: (id: BellStateId) => void
  onPrepare: () => void
  disabled?: boolean
}

/**
 * Level 7E — choose a Bell state and watch familiar gates build it.
 */
export default function BellStatePreparationPanel({
  selected,
  onSelect,
  onPrepare,
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
    </aside>
  )
}

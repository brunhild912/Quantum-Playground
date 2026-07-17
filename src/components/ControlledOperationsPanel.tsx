import type { QubitId } from '../lib/qubitId'

type ControlledOperationsPanelProps = {
  control: QubitId
  target: QubitId
  onControlChange: (id: QubitId) => void
  onTargetChange: (id: QubitId) => void
  onApply: () => void
  disabled?: boolean
  pulseProgress?: number | null
}

/**
 * Level 7C — choose Control / Target and apply CNOT.
 */
export default function ControlledOperationsPanel({
  control,
  target,
  onControlChange,
  onTargetChange,
  onApply,
  disabled = false,
  pulseProgress = null,
}: ControlledOperationsPanelProps) {
  const invalid = control === target
  const canApply = !disabled && !invalid

  return (
    <aside
      className="controlled-ops-panel"
      role="region"
      aria-label="Controlled operations"
    >
      <header className="controlled-ops-panel-header">
        <h2 className="controlled-ops-panel-title">Controlled Operations</h2>
      </header>

      <div className="controlled-ops-panel-rule" aria-hidden="true" />

      <fieldset className="controlled-ops-fieldset">
        <legend className="controlled-ops-legend">Control</legend>
        <label className="controlled-ops-option">
          <input
            type="radio"
            name="cnot-control"
            checked={control === 'A'}
            onChange={() => onControlChange('A')}
            disabled={disabled}
          />
          <span>Qubit A</span>
        </label>
        <label className="controlled-ops-option">
          <input
            type="radio"
            name="cnot-control"
            checked={control === 'B'}
            onChange={() => onControlChange('B')}
            disabled={disabled}
          />
          <span>Qubit B</span>
        </label>
      </fieldset>

      <div className="controlled-ops-panel-rule" aria-hidden="true" />

      <fieldset className="controlled-ops-fieldset">
        <legend className="controlled-ops-legend">Target</legend>
        <label className="controlled-ops-option">
          <input
            type="radio"
            name="cnot-target"
            checked={target === 'A'}
            onChange={() => onTargetChange('A')}
            disabled={disabled}
          />
          <span>Qubit A</span>
        </label>
        <label className="controlled-ops-option">
          <input
            type="radio"
            name="cnot-target"
            checked={target === 'B'}
            onChange={() => onTargetChange('B')}
            disabled={disabled}
          />
          <span>Qubit B</span>
        </label>
      </fieldset>

      {invalid ? (
        <p className="controlled-ops-helper" role="status">
          Control and Target must be different qubits.
        </p>
      ) : null}

      <button
        type="button"
        className="quantum-action-btn controlled-ops-apply"
        onClick={onApply}
        disabled={!canApply}
      >
        Apply CNOT
      </button>

      {pulseProgress != null ? (
        <div className="controlled-ops-pulse-track" aria-hidden="true">
          <div
            className="controlled-ops-pulse-thumb"
            style={{ left: `${Math.min(100, pulseProgress * 100)}%` }}
          />
        </div>
      ) : null}
    </aside>
  )
}

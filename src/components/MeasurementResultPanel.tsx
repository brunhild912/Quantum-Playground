import type { MeasurementResult } from '../hooks/useMeasurementSequence'

type MeasurementResultPanelProps = {
  result: MeasurementResult
  onClose: () => void
}

export default function MeasurementResultPanel({
  result,
  onClose,
}: MeasurementResultPanelProps) {
  return (
    <aside
      className="measurement-result-panel learning-popup scrollbar-quantum"
      role="status"
      aria-live="polite"
      aria-label="Measurement result"
    >
      <header className="measurement-result-header">
        <h2 className="measurement-result-title">Measurement Result</h2>
        <button
          type="button"
          className="measurement-result-close"
          onClick={onClose}
          aria-label="Close measurement result"
        >
          ×
        </button>
      </header>

      <div className="measurement-result-rule" aria-hidden="true" />

      <p className="measurement-result-label">Measured</p>
      {result.registerLabel ? (
        <p className="measurement-result-label">{result.registerLabel}</p>
      ) : null}
      <p className="measurement-result-outcome">{result.outcome}</p>

      {result.correlatedRegisterLabel && result.correlatedOutcome ? (
        <>
          <p className="measurement-result-label">Partner qubit collapsed</p>
          <p className="measurement-result-note">
            {result.correlatedRegisterLabel} = {result.correlatedOutcome}
          </p>
        </>
      ) : null}

      <p className="measurement-result-label">Previous probabilities</p>
      <ul className="measurement-result-probs">
        <li>
          <span>|0⟩</span>
          <span>{result.percent0}%</span>
        </li>
        <li>
          <span>|1⟩</span>
          <span>{result.percent1}%</span>
        </li>
      </ul>

      <p className="measurement-result-note">
        The quantum state has collapsed. Future measurements will return this
        same state until another quantum gate changes it.
      </p>
    </aside>
  )
}

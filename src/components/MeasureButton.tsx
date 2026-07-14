type MeasureButtonProps = {
  onMeasure: () => void
  onXGate?: () => void
  onZGate?: () => void
  disabled?: boolean
  xGlowing?: boolean
  zGlowing?: boolean
}

/**
 * Additive quantum-ops strip.
 * Desktop: floating X / Z / Measure row.
 * Mobile: compact vertical cluster beside the Probability card.
 */
export default function MeasureButton({
  onMeasure,
  onXGate,
  onZGate,
  disabled = false,
  xGlowing = false,
  zGlowing = false,
}: MeasureButtonProps) {
  return (
    <div className="quantum-actions" role="group" aria-label="Quantum operations">
      <div className="quantum-actions-grid">
        {onXGate ? (
          <button
            type="button"
            className={`quantum-action-btn${xGlowing ? ' quantum-action-btn--glow' : ''}`}
            onClick={onXGate}
            disabled={disabled}
          >
            X
          </button>
        ) : null}
        {onZGate ? (
          <button
            type="button"
            className={`quantum-action-btn${zGlowing ? ' quantum-action-btn--glow' : ''}`}
            onClick={onZGate}
            disabled={disabled}
          >
            Z
          </button>
        ) : null}
        <button
          type="button"
          className="quantum-action-btn quantum-action-btn--measure"
          onClick={onMeasure}
          disabled={disabled}
        >
          Measure
        </button>
      </div>
    </div>
  )
}

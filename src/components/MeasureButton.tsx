type MeasureButtonProps = {
  onMeasure: () => void
  onXGate?: () => void
  onYGate?: () => void
  onZGate?: () => void
  onSGate?: () => void
  disabled?: boolean
  xGlowing?: boolean
  yGlowing?: boolean
  zGlowing?: boolean
  sGlowing?: boolean
}

/**
 * Additive quantum-ops strip.
 * Desktop: floating X / Y / Z / S / Measure row.
 * Mobile: compact vertical cluster beside the Probability card.
 */
export default function MeasureButton({
  onMeasure,
  onXGate,
  onYGate,
  onZGate,
  onSGate,
  disabled = false,
  xGlowing = false,
  yGlowing = false,
  zGlowing = false,
  sGlowing = false,
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
        {onYGate ? (
          <button
            type="button"
            className={`quantum-action-btn${yGlowing ? ' quantum-action-btn--glow' : ''}`}
            onClick={onYGate}
            disabled={disabled}
          >
            Y
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
        {onSGate ? (
          <button
            type="button"
            className={`quantum-action-btn${sGlowing ? ' quantum-action-btn--glow' : ''}`}
            onClick={onSGate}
            disabled={disabled}
          >
            S
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

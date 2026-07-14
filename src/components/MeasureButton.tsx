type MeasureButtonProps = {
  onMeasure: () => void
  onXGate?: () => void
  onZGate?: () => void
  disabled?: boolean
  xGlowing?: boolean
  zGlowing?: boolean
}

/**
 * Additive quantum-ops strip. Gates sit beside MEASURE without touching the Control Dock.
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
        className="quantum-action-btn"
        onClick={onMeasure}
        disabled={disabled}
      >
        Measure
      </button>
    </div>
  )
}

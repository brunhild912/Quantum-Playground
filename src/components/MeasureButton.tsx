type MeasureButtonProps = {
  onMeasure: () => void
  onXGate?: () => void
  disabled?: boolean
  xGlowing?: boolean
}

/**
 * Additive quantum-ops strip. Gates sit beside MEASURE without touching the Control Dock.
 */
export default function MeasureButton({
  onMeasure,
  onXGate,
  disabled = false,
  xGlowing = false,
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

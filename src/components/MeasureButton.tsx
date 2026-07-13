type MeasureButtonProps = {
  onMeasure: () => void
  disabled?: boolean
}

/**
 * Additive quantum-ops strip. MEASURE sits here; future gates (e.g. Hadamard)
 * can join the same row without touching the Control Dock.
 */
export default function MeasureButton({
  onMeasure,
  disabled = false,
}: MeasureButtonProps) {
  return (
    <div className="quantum-actions" role="group" aria-label="Quantum operations">
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

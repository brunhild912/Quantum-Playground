type TeleportationPanelProps = {
  classicalBits: string | null
  onStart: () => void
  onReset: () => void
  disabled?: boolean
  busy?: boolean
  active?: boolean
}

/**
 * Level 7G — quantum teleportation controls.
 */
export default function TeleportationPanel({
  classicalBits,
  onStart,
  onReset,
  disabled = false,
  busy = false,
  active = false,
}: TeleportationPanelProps) {
  return (
    <aside
      className="teleport-panel"
      role="region"
      aria-label="Quantum teleportation"
    >
      <header className="teleport-panel-header">
        <h2 className="teleport-panel-title">Quantum Teleportation</h2>
      </header>

      <div className="teleport-panel-rule" aria-hidden="true" />

      <p className="teleport-panel-hint">
        Alice holds an unknown state. An entangled pair links the protocol to
        Bob. Watch each step unfold.
      </p>

      {classicalBits ? (
        <div className="teleport-classical" role="status" aria-live="polite">
          <p className="teleport-classical-label">Classical Message</p>
          <p className="teleport-classical-bits">{classicalBits}</p>
        </div>
      ) : null}

      <button
        type="button"
        className="quantum-action-btn teleport-panel-apply"
        onClick={onStart}
        disabled={disabled || busy}
      >
        Start Teleportation
      </button>

      <button
        type="button"
        className="quantum-action-btn teleport-panel-apply teleport-panel-apply--secondary"
        onClick={onReset}
        disabled={disabled || (busy && !active)}
      >
        Reset
      </button>
    </aside>
  )
}
